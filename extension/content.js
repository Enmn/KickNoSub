console.log("Kick Unlocker: Content script loaded (v20.0 - Instant Zap)");

let activeHls = null;
let isUnlocking = false;

// --- SVG ICONS ---
const ICONS = {
    play: `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    maximize: `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L5.09 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`
};

function getResumeKey(channelSlug, videoSlug) {
    return `kick_unlocker_resume:${channelSlug}:${videoSlug}`;
}

function checkStreamUrl(url) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 3000);
        chrome.runtime.sendMessage({ action: "CHECK_STREAM_URL", url: url }, (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) resolve(null);
            else resolve(response && response.valid ? url : null);
        });
    });
}

async function getVideoMetadata(channelSlug, videoSlug) {
    try {
        const response = await fetch(`https://kick.com/api/v1/channels/${channelSlug}`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
            video: data.previous_livestreams ? data.previous_livestreams.find(v => v.slug === videoSlug || v.video.uuid === videoSlug) : null,
            channelId: data.id,
            channelSlug: channelSlug
        };
    } catch (e) { return null; }
}

async function findStreamUrlFromMetadata(metadata) {
    const { video, channelId } = metadata;
    if (!video) return null;

    // Quick candidate gen
    const thumbUrl = video.thumbnail.src || video.thumbnail.url;
    const candidates = [];
    if (thumbUrl) {
        const parts = thumbUrl.split('/');
        const ivsIndex = parts.indexOf('ivs');
        if (ivsIndex !== -1 && parts[ivsIndex + 1] === 'v1') candidates.push({ cid: parts[ivsIndex + 2], vid: parts[ivsIndex + 3] });
        else if (parts.length > 5) candidates.push({ cid: parts[4], vid: parts[5] });
    }
    if (channelId && video.video.uuid) candidates.push({ cid: channelId, vid: video.video.uuid });
    if (channelId && video.id) candidates.push({ cid: channelId, vid: video.id });

    const uniqueCandidates = candidates.filter((item, index, self) =>
        index === self.findIndex((t) => t.cid === item.cid && t.vid === item.vid)
    );

    let startTimeStr = video.start_time.replace(' ', 'T');
    if (!startTimeStr.endsWith('Z')) startTimeStr += 'Z';
    const startTime = new Date(startTimeStr);
    const baseUrls = ["https://stream.kick.com/ivs/v1/196233775518", "https://stream.kick.com/3c81249a5ce0/ivs/v1/196233775518", "https://stream.kick.com/0f3cb0ebce7/ivs/v1/196233775518"];

    const tasks = [];
    const offsets = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5];

    for (const offset of offsets) {
        const t = new Date(startTime.getTime() + (offset * 60000));
        const y = t.getUTCFullYear();
        const m = t.getUTCMonth() + 1;
        const d = t.getUTCDate();
        const h = t.getUTCHours();
        const min = t.getUTCMinutes();
        for (const candidate of uniqueCandidates) {
            for (const base of baseUrls) {
                tasks.push(`${base}/${candidate.cid}/${y}/${m}/${d}/${h}/${min}/${candidate.vid}/media/hls/master.m3u8`);
            }
        }
    }
    for (const url of tasks) {
        if (await checkStreamUrl(url)) return url;
    }
    return null;
}

class ChatController {
    constructor(channelId, videoStartTime, container) {
        this.channelId = channelId;
        this.videoStartTime = videoStartTime;
        this.container = container;
        this.messages = [];
        this.videoElement = null;
        this.activeSessionId = 0;
    }

    init(initialVideoElement = null) {
        if (this.container) {
            this.container.innerHTML = `
                <div style="height:100%;display:flex;flex-direction:column;font-family:Inter,sans-serif;">
                    <div id="kick-unlocker-chat-list" style="flex:1;overflow-y:auto;padding:10px;font-size:13px;color:#fff;">
                        <br><div style="text-align:center;color:#888;">Connecting...</div>
                    </div>
                </div>`;
            this.chatList = this.container.querySelector('#kick-unlocker-chat-list');
        }
        if (initialVideoElement) this.connectVideo(initialVideoElement);
        this.fetchLoop(this.activeSessionId);
    }

    connectVideo(videoElement) {
        this.videoElement = videoElement;
        videoElement.addEventListener('timeupdate', () => this.updateUI(videoElement.currentTime));
        videoElement.addEventListener('seeking', () => {
            this.activeSessionId++;
            this.messages = [];
            if (this.chatList) this.chatList.innerHTML = '<br><div style="text-align:center;color:#888;">Syncing...</div>';
            this.fetchLoop(this.activeSessionId);
        });
    }

    parseContent(content) {
        if (!content) return "";
        return content.replace(/\[emote:(\d+):([^\]]+)\]/g, (match, id, name) =>
            `<img src="https://files.kick.com/emotes/${id}/fullsize" alt="${name}" title="${name}" style="height:1.8em;vertical-align:middle;display:inline-block;margin:0 2px;">`
        );
    }

    async fetchLoop(sessionId) {
        let currentCursor = null;
        while (this.activeSessionId === sessionId) {
            try {
                let url = `https://kick.com/api/v2/channels/${this.channelId}/messages`;
                if (currentCursor) url += `?cursor=${currentCursor}`;
                else {
                    let targetTime = this.videoStartTime;
                    if (this.videoElement) targetTime = new Date(this.videoStartTime.getTime() + (this.videoElement.currentTime * 1000));
                    url += `?start_time=${targetTime.toISOString()}`;
                }
                const res = await fetch(url);
                if (!res.ok) { await new Promise(r => setTimeout(r, 2000)); continue; }
                const data = await res.json();
                if (this.activeSessionId !== sessionId) break;

                const msgs = data.messages || (data.data && data.data.messages) || [];
                if (msgs.length) {
                    msgs.forEach(msg => { if (!this.messages.some(m => m.id === msg.id)) this.messages.push(msg); });
                    this.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    if (this.videoElement) this.updateUI(this.videoElement.currentTime);
                }
                currentCursor = data.cursor || (data.data && data.data.cursor) || data.next_cursor;
                if (!currentCursor) { currentCursor = null; await new Promise(r => setTimeout(r, 2000)); } // Retry/Recovery
                else {
                    if (this.messages.length && this.videoElement) {
                        const lastT = new Date(this.messages[this.messages.length - 1].created_at).getTime();
                        const vidT = this.videoStartTime.getTime() + (this.videoElement.currentTime * 1000);
                        if (lastT > vidT + 60000) await new Promise(r => setTimeout(r, 1000));
                        else await new Promise(r => setTimeout(r, 50));
                    } else await new Promise(r => setTimeout(r, 50));
                }
            } catch (e) { await new Promise(r => setTimeout(r, 2000)); }
        }
    }

    updateUI(cwdSeconds) {
        if (!this.chatList) return;
        const absTime = this.videoStartTime.getTime() + (cwdSeconds * 1000);
        let limit = -1;
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (new Date(this.messages[i].created_at).getTime() <= absTime) { limit = i; break; }
        }
        if (limit === -1) return;
        const subset = this.messages.slice(Math.max(0, limit - 75), limit + 1);
        const lastM = subset[subset.length - 1];
        if (!lastM || (this.lastRenderedMsgId === lastM.id && subset.length >= 50)) return;

        this.chatList.innerHTML = subset.map(msg => `
            <div style="margin-bottom:4px;line-height:1.4;word-wrap:break-word;">
                <span style="color:${msg.sender.identity?.color || '#53fc18'};font-weight:bold;margin-right:5px;">${msg.sender.username}:</span>
                <span style="color:#efeff1;">${this.parseContent(msg.content)}</span>
            </div>`).join('');
        this.chatList.scrollTop = this.chatList.scrollHeight;
        this.lastRenderedMsgId = lastM.id;
    }
}

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

async function unlockVideo(triggerElement) {
    if (isUnlocking) return;
    const container = triggerElement.closest('.relative.flex.flex-col');
    if (!container || container.dataset.kickUnlockerProcessing) return;

    if (activeHls) { activeHls.destroy(); activeHls = null; }

    try {
        isUnlocking = true;

        // --- STEP 1: FULL WIPE & SPLASH ---
        // Immediately hide everything (including the underlying placeholder) and show our splash screen
        container.innerHTML = `
            <div style="width:100%;height:100%;background:#000;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:Inter,sans-serif;">
                <div style="font-size:24px;font-weight:bold;color:#53fc18;margin-bottom:8px;">🔓 Kick Unlocker</div>
                <div style="font-size:14px;color:rgba(255,255,255,0.7);">Searching stream...</div>
            </div>
        `;

        const pathParts = window.location.pathname.split('/').filter(Boolean);
        let channelSlug = pathParts[0];
        let videoSlug = pathParts[2];
        const resumeKey = getResumeKey(channelSlug, videoSlug);
        if (!videoSlug && pathParts[1] === 'video') videoSlug = pathParts[2];

        const result = await getVideoMetadata(channelSlug, videoSlug);
        if (!result) return; // Silent fail or keep deleted

        const streamUrl = await findStreamUrlFromMetadata(result);
        if (!streamUrl) {
            container.innerHTML = `
              <div style="width:100%;height:100%;background:#000;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:Inter,sans-serif;">
                  <div style="font-size:24px;color:red;font-weight:bold;">Stream Not Found</div>
              </div>`;
            return;
        }

        // --- STEP 2: FULL UNLOCK ---
        container.dataset.kickUnlockerProcessing = "true";
        container.innerHTML = ''; // WIPE ALL
        container.style.background = '#000';

        // Check for Chat
        const existingChat = document.querySelector('#chatroom-messages');
        let chatRoot = null;
        if (existingChat) {
            existingChat.innerHTML = '';
            existingChat.style.display = 'block';
            chatRoot = existingChat;
        } else {
            container.innerHTML = `<div style="display:flex;width:100%;height:100%;"><div id="unlocker-video-area" style="flex:1;background:#000;position:relative;"></div><div id="unlocker-chat-area" style="width:320px;height:100%;border-left:1px solid #333;"></div></div>`;
            chatRoot = container.querySelector('#unlocker-chat-area');
        }

        const startTime = new Date(result.video.start_time.replace(' ', 'T') + (result.video.start_time.endsWith('Z') ? '' : 'Z'));
        const chatController = new ChatController(result.channelId, startTime, chatRoot);
        chatController.init(null);

        const finalUrl = streamUrl + (streamUrl.includes('?') ? '&' : '?') + 'kick_ts=' + Date.now();
        let videoParent = existingChat ? container : container.querySelector('#unlocker-video-area');

        // Build Custom Player UI
        const playerHTML = `
            <div id="k-player" style="width:100%;height:100%;position:relative;background:black;overflow:hidden;font-family:Inter,sans-serif;">
                <video id="k-video" playsinline style="width:100%;height:100%;object-fit:contain;"></video>
                <div id="k-controls" style="position:absolute;bottom:0;left:0;width:100%;padding:20px 15px 10px 15px;background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);display:flex;flex-direction:column;opacity:0;transition:opacity 0.2s;">
                    <div id="k-track" style="width:100%;height:5px;background:rgba(255,255,255,0.3);cursor:pointer;position:relative;margin-bottom:10px;border-radius:2px;">
                         <div id="k-progress" style="width:0%;height:100%;background:#53fc18;position:relative;border-radius:2px;"></div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <div style="display:flex;align-items:center;gap:15px;">
                            <button id="k-play" style="background:none;border:none;cursor:pointer;opacity:0.9;">${ICONS.play}</button>
                            <span id="k-time" style="font-size:13px;color:#ddd;font-variant-numeric:tabular-nums;">0:00 / 0:00</span>
                            <input id="k-volume" type="range" min="0" max="1" step="0.01" value="1">
                        </div>
                        <div style="display:flex;align-items:center;gap:15px;">
                            <select id="k-quality" style="background:rgba(0,0,0,0.5);color:white;border:1px solid #444;border-radius:4px;padding:2px 5px;font-size:12px;cursor:pointer;outline:none;">
                                <option value="-1">Auto</option>
                            </select>
                            <button id="k-fs" style="background:none;border:none;cursor:pointer;opacity:0.9;">${ICONS.maximize}</button>
                        </div>
                    </div>
                </div>
                <button id="k-big-play" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:70px;height:70px;background:rgba(0,0,0,0.5);border-radius:50%;border:2px solid #53fc18;color:#53fc18;cursor:pointer;display:none;align-items:center;justify-content:center;">
                    <svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:#53fc18;margin-left:5px;"><path d="M8 5v14l11-7z"/></svg>
                </button>
            </div>
        `;

        videoParent.innerHTML = playerHTML;
        const pRoot = videoParent.querySelector('#k-player');
        const vid = videoParent.querySelector('#k-video');
        const controls = videoParent.querySelector('#k-controls');
        const btnPlay = videoParent.querySelector('#k-play');
        const btnFs = videoParent.querySelector('#k-fs');
        const btnBig = videoParent.querySelector('#k-big-play');
        const progressBar = videoParent.querySelector('#k-progress');
        const track = videoParent.querySelector('#k-track');
        const timeDisplay = videoParent.querySelector('#k-time');
        const qualSel = videoParent.querySelector('#k-quality');

        const volumeSlider = videoParent.querySelector('#k-volume');
        
        volumeSlider.addEventListener('input', () => {
            vid.volume = volumeSlider.value;
        });

        chatController.connectVideo(vid);

        const togglePlay = () => { if (vid.paused) vid.play(); else vid.pause(); };
        vid.addEventListener('click', togglePlay);
        btnPlay.addEventListener('click', togglePlay);
        btnBig.addEventListener('click', togglePlay);
        vid.addEventListener('play', () => { btnPlay.innerHTML = ICONS.pause; btnBig.style.display = 'none'; });
        vid.addEventListener('pause', () => { btnPlay.innerHTML = ICONS.play; btnBig.style.display = 'flex'; });
        let lastSave = 0;
        
        vid.addEventListener('timeupdate', () => {
            if (Date.now() - lastSave > 4000) {
                localStorage.setItem(resumeKey, vid.currentTime);
                lastSave = Date.now();
            }
        
            if (isFinite(vid.duration)) {
                progressBar.style.width = (vid.currentTime / vid.duration * 100) + '%';
                timeDisplay.textContent =
                    `${formatTime(vid.currentTime)} / ${formatTime(vid.duration)}`;
            }
        });
        vid.addEventListener('ended', () => {
            localStorage.removeItem(resumeKey);
        });
        track.addEventListener('click', (e) => {
            const rect = track.getBoundingClientRect();
            if (vid.duration) vid.currentTime = ((e.clientX - rect.left) / rect.width) * vid.duration;
        });
        pRoot.addEventListener('mouseenter', () => controls.style.opacity = '1');
        pRoot.addEventListener('mouseleave', () => { if (!vid.paused) controls.style.opacity = '0'; });
        btnFs.addEventListener('click', () => { if (!document.fullscreenElement) pRoot.requestFullscreen(); else document.exitFullscreen(); });
        vid.addEventListener('dblclick', () => btnFs.click());

        if (Hls.isSupported()) {
            const hls = new Hls({ debug: false, enableWorker: false, lowLatencyMode: true });
            activeHls = hls;
            hls.loadSource(finalUrl);
            hls.attachMedia(vid);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                hls.levels.forEach((lvl, idx) => {
                    const opt = document.createElement('option');
                    opt.value = idx; opt.text = lvl.height + 'p';
                    qualSel.appendChild(opt);
                });
                qualSel.onchange = () => hls.currentLevel = parseInt(qualSel.value);
                vid.play().catch(() => btnBig.style.display = 'flex');
            });
            const savedTime = parseFloat(localStorage.getItem(resumeKey));
            
            if (Number.isFinite(savedTime) && savedTime > 1) {
                vid.addEventListener('loadedmetadata', () => {
                    if (Number.isFinite(vid.duration)) {
                        vid.currentTime = Math.min(savedTime, vid.duration - 1);
                    } else {
                        vid.currentTime = savedTime;
                    }
                }, { once: true });
            }

            hls.on(Hls.Events.ERROR, (e, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                    else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                    else hls.destroy();
                }
            });
        } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
            vid.src = finalUrl;
        }

    } catch (e) { console.error(e); if (container) delete container.dataset.kickUnlockerProcessing; } finally { isUnlocking = false; }
}

const observer = new MutationObserver((mutations) => {
    const subscriberOverlay = document.querySelector('[data-testid="video-subscriber-only"]');
    if (subscriberOverlay) {
        const outerContainer = subscriberOverlay.closest('.relative.flex.flex-col.items-center.justify-center.overflow-hidden.rounded');
        if (outerContainer && !outerContainer.dataset.kickUnlockerProcessing && !isUnlocking) {
            unlockVideo(subscriberOverlay);
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });