console.log("Kick Unlocker: Content script loaded (v20.3 - Numerical Channel ID Pipeline)");

let activeHls = null;
let isUnlocking = false;
let latestReleasePromise = null;
let activePlayerUi = null;
let activeChatController = null;
let globalPlayerListenersBound = false;

// --- SVG ICONS ---
const ICONS = {
    play: `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    maximize: `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L5.09 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6-3.6 3.6z"/></svg>`,
    update: `<svg width="98" height="96" viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><g clip-path="url(#clip0_730_27136)"><path d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" fill="white"/></g><defs><clipPath id="clip0_730_27136"><rect width="98" height="96" fill="white"/></clipPath></defs></svg>`,
    bigPlay: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;width:40px;height:40px;"><path fill="none" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>`,
    backward: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;"><path d="M12 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 12 18z"/><path d="M22 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 22 18z"/></svg>`,
    forward: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;"><path d="M12 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 12 18z"/><path d="M2 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 2 18z"/></svg>`,
    volumeHigh: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;"><path fill="none" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298zM16 9a5 5 0 0 1 0 6m3.364 3.364a9 9 0 0 0 0-12.728"/></svg>`,
    volumeMedium: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;"><path fill="none" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298zM16 9a5 5 0 0 1 0 6"/></svg>`,
    volumeLow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;"><path fill="none" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/></svg>`,
    volumeMute: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;"><path fill="none" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298zM22 9l-6 6m0-6l6 6"/></svg>`
};

function getResumeKey(channelSlug, videoSlug) {
    return `kick_unlocker_resume:${channelSlug}:${videoSlug}`;
}

function getPlayerSettingsKey(channelSlug, videoSlug) {
    return `kick_unlocker_settings:${channelSlug}:${videoSlug}`;
}

function loadPlayerSettings(settingsKey) {
    try {
        const raw = localStorage.getItem(settingsKey);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function savePlayerSettings(settingsKey, partialSettings) {
    const currentSettings = loadPlayerSettings(settingsKey);
    localStorage.setItem(settingsKey, JSON.stringify({
        ...currentSettings,
        ...partialSettings
    }));
}

function normalizeVersion(version) {
    return String(version || '')
        .trim()
        .replace(/^v/i, '')
        .split(/[^0-9]+/)
        .filter(Boolean)
        .map((part) => parseInt(part, 10));
}

function isVersionGreater(candidateVersion, currentVersion) {
    const candidateParts = normalizeVersion(candidateVersion);
    const currentParts = normalizeVersion(currentVersion);
    const maxLength = Math.max(candidateParts.length, currentParts.length);

    for (let index = 0; index < maxLength; index++) {
        const candidate = candidateParts[index] || 0;
        const current = currentParts[index] || 0;
        if (candidate > current) return true;
        if (candidate < current) return false;
    }

    return false;
}

function getLatestReleaseInfo() {
    if (latestReleasePromise) return latestReleasePromise;

    latestReleasePromise = new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'GET_LATEST_RELEASE' }, (response) => {
            if (chrome.runtime.lastError) {
                resolve(null);
                return;
            }

            const release = response?.release;
            const currentVersion = chrome.runtime.getManifest().version;

            if (release?.tagName && release?.htmlUrl && isVersionGreater(release.tagName, currentVersion)) {
                resolve(release);
                return;
            }

            resolve(null);
        });
    });

    return latestReleasePromise;
}

async function fetchJson(url) {
    // 1. Try background service worker first
    try {
        const bgData = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(undefined), 3000);
            chrome.runtime.sendMessage({ action: "FETCH_JSON", url: url }, (response) => {
                clearTimeout(timeout);
                if (chrome.runtime.lastError || !response) resolve(undefined);
                else resolve(response.data);
            });
        });
        if (bgData !== undefined && bgData !== null) {
            return bgData;
        }
    } catch (e) {}

    // 2. Direct fetch fallback from page
    try {
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json, text/plain, */*' }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {}

    return null;
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

function bindGlobalPlayerListeners() {
    if (globalPlayerListenersBound) return;

    document.addEventListener('click', (event) => {
        const qualWrap = activePlayerUi?.qualWrap;
        if (qualWrap && qualWrap.isConnected && !qualWrap.contains(event.target)) {
            qualWrap.classList.remove('open');
        }
        const speedWrap = activePlayerUi?.speedWrap;
        if (speedWrap && speedWrap.isConnected && !speedWrap.contains(event.target)) {
            speedWrap.classList.remove('open');
        }
    });

    document.addEventListener('keydown', (event) => {
        const playerUi = activePlayerUi;
        const videoElement = playerUi?.vid;
        if (!videoElement || !videoElement.isConnected || !isFinite(videoElement.duration)) return;

        const target = event.target;
        const tagName = target?.tagName;
        if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tagName)) return;

        const key = event.key;

        if (key === ' ' || key === 'k' || key === 'K') {
            event.preventDefault();
            playerUi.togglePlay?.();
        } else if (key === 'f' || key === 'F') {
            event.preventDefault();
            playerUi.toggleFullscreen?.();
        } else if (key === 'm' || key === 'M') {
            event.preventDefault();
            playerUi.toggleMute?.();
        } else if (key === 'ArrowRight') {
            event.preventDefault();
            videoElement.currentTime = Math.min(videoElement.currentTime + 5, videoElement.duration);
            playerUi.showSeekIndicator('forward');
        } else if (key === 'ArrowLeft') {
            event.preventDefault();
            videoElement.currentTime = Math.max(videoElement.currentTime - 5, 0);
            playerUi.showSeekIndicator('backward');
        } else if (key === 'l' || key === 'L') {
            event.preventDefault();
            videoElement.currentTime = Math.min(videoElement.currentTime + 10, videoElement.duration);
            playerUi.showSeekIndicator('forward');
        } else if (key === 'j' || key === 'J') {
            event.preventDefault();
            videoElement.currentTime = Math.max(videoElement.currentTime - 10, 0);
            playerUi.showSeekIndicator('backward');
        } else if (key === 'ArrowUp') {
            event.preventDefault();
            playerUi.applyVolume?.(Math.min(1, videoElement.volume + 0.1));
        } else if (key === 'ArrowDown') {
            event.preventDefault();
            playerUi.applyVolume?.(Math.max(0, videoElement.volume - 0.1));
        } else if (key >= '0' && key <= '9') {
            event.preventDefault();
            const pct = parseInt(key, 10) / 10;
            videoElement.currentTime = pct * videoElement.duration;
        }
    });

    globalPlayerListenersBound = true;
}

function extractMetadataFromDOM(channelSlug, videoSlug) {
    try {
        const scripts = document.querySelectorAll('script');
        const targetSlug = String(videoSlug || '').toLowerCase().trim();

        for (const script of scripts) {
            const text = script.textContent || '';
            if (!text || (!text.includes('channel') && !text.includes('livestream') && !text.includes('video'))) continue;

            const matches = text.match(/\{"id":.*?\}/g);
            if (matches) {
                for (const matchStr of matches) {
                    try {
                        const obj = JSON.parse(matchStr);
                        if (obj && (obj.channel_id || obj.id)) {
                            const isMatch = targetSlug && (
                                String(obj.slug || '').toLowerCase() === targetSlug ||
                                String(obj.uuid || obj.video?.uuid || '').toLowerCase() === targetSlug ||
                                String(obj.id || '').toLowerCase() === targetSlug
                            );
                            if (isMatch) {
                                return {
                                    video: obj,
                                    channelId: obj.channel_id || obj.channel?.id || obj.user_id,
                                    channelSlug: channelSlug || obj.channel?.slug
                                };
                            }
                        }
                    } catch (e) {}
                }
            }
        }
    } catch (e) {}
    return null;
}

async function getVideoMetadata(channelSlug, videoSlug) {
    const findVideoInList = (list) => {
        if (!Array.isArray(list) || list.length === 0) return null;
        const target = String(videoSlug || '').toLowerCase().trim();

        let found = list.find(v => {
            if (!v) return false;
            const slug = String(v.slug || '').toLowerCase();
            const uuid = String(v.uuid || v.video?.uuid || '').toLowerCase();
            const id = String(v.id || '').toLowerCase();
            return (target && (slug === target || uuid === target || id === target));
        });

        if (!found && target.length > 5) {
            found = list.find(v => {
                if (!v) return false;
                const jsonStr = JSON.stringify(v).toLowerCase();
                return jsonStr.includes(target);
            });
        }

        if (!found && list.length === 1) {
            found = list[0];
        }

        return found;
    };

    // Step 0: Try DOM Extraction directly from page scripts
    const domResult = extractMetadataFromDOM(channelSlug, videoSlug);
    if (domResult && domResult.video) {
        return domResult;
    }

    // Step 1: Get channel details to resolve NUMERICAL channelId
    let numericalChannelId = null;
    let channelData = null;

    if (channelSlug) {
        for (const chanUrl of [
            `https://web.kick.com/api/v1/channels/${channelSlug}`,
            `https://kick.com/api/v1/channels/${channelSlug}`,
            `https://kick.com/api/v2/channels/${channelSlug}`
        ]) {
            const resData = await fetchJson(chanUrl);
            if (resData && (resData.id || resData.channel_id || resData.user_id)) {
                channelData = resData;
                numericalChannelId = resData.id || resData.channel_id || resData.user_id;
                break;
            }
        }
    }

    // Check if video exists in channel details (previous_livestreams)
    if (channelData) {
        const matched = findVideoInList(channelData.previous_livestreams || channelData.videos);
        if (matched) {
            return {
                video: matched,
                channelId: numericalChannelId,
                channelSlug: channelSlug
            };
        }
    }

    // Step 2: Fetch videos endpoint using NUMERICAL channelId
    if (numericalChannelId) {
        for (const videosUrl of [
            `https://web.kick.com/api/v1/channels/${numericalChannelId}/videos`,
            `https://kick.com/api/v1/channels/${numericalChannelId}/videos`,
            `https://web.kick.com/api/v1/channels/${channelSlug}/videos`
        ]) {
            const data = await fetchJson(videosUrl);
            if (data) {
                const videos = Array.isArray(data) ? data : (data.videos || data.data || data.previous_livestreams || []);
                const matched = findVideoInList(videos);
                if (matched) {
                    return {
                        video: matched,
                        channelId: numericalChannelId,
                        channelSlug: channelSlug
                    };
                }
            }
        }
    }

    // Step 3: Direct video endpoints if videoSlug exists
    if (videoSlug) {
        for (const endpoint of [
            `https://web.kick.com/api/v1/video/${videoSlug}`,
            `https://web.kick.com/api/v1/videos/${videoSlug}`,
            `https://kick.com/api/v1/video/${videoSlug}`,
            `https://web.kick.com/api/v1/sub-only-videos/${videoSlug}`
        ]) {
            const data = await fetchJson(endpoint);
            if (data) {
                const vid = data.video || data.data || data;
                if (vid && (vid.id || vid.uuid || vid.start_time)) {
                    const cId = vid.channel_id || vid.channel?.id || vid.user_id || numericalChannelId;
                    const cSlug = channelSlug || vid.channel?.slug || vid.channel_slug;
                    return {
                        video: vid,
                        channelId: cId,
                        channelSlug: cSlug
                    };
                }
            }
        }
    }

    // Step 4: Fallback metadata if numericalChannelId and videoSlug are known
    if (numericalChannelId && videoSlug) {
        return {
            video: {
                id: videoSlug,
                uuid: videoSlug,
                start_time: new Date().toISOString(),
                thumbnail: { url: "" }
            },
            channelId: numericalChannelId,
            channelSlug: channelSlug
        };
    }

    console.error("[Kick Unlocker] Unable to find video metadata");
    return null;
}

async function findStreamUrlFromMetadata(metadata) {
    const { video, channelId } = metadata;
    if (!video && !channelId) return null;

    // Quick candidate gen
    const thumbUrl = video?.thumbnail ? (video.thumbnail.src || video.thumbnail.url || (typeof video.thumbnail === 'string' ? video.thumbnail : '')) : '';
    const candidates = [];
    if (thumbUrl) {
        const parts = thumbUrl.split('/');
        const ivsIndex = parts.indexOf('ivs');
        if (ivsIndex !== -1 && parts[ivsIndex + 1] === 'v1') candidates.push({ cid: parts[ivsIndex + 2], vid: parts[ivsIndex + 3] });
        else if (parts.length > 5) candidates.push({ cid: parts[4], vid: parts[5] });
    }
    const vidUuid = video?.video?.uuid || video?.uuid || video?.id;
    if (channelId && vidUuid) candidates.push({ cid: channelId, vid: vidUuid });
    if (channelId && video?.id) candidates.push({ cid: channelId, vid: video.id });

    const uniqueCandidates = candidates.filter((item, index, self) =>
        index === self.findIndex((t) => t.cid === item.cid && t.vid === item.vid)
    );

    let startTimeStr = (video?.start_time || video?.created_at || '').replace(' ', 'T');
    if (startTimeStr && !startTimeStr.endsWith('Z')) startTimeStr += 'Z';
    const startTime = startTimeStr ? new Date(startTimeStr) : new Date();
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

    destroy() {
        this.activeSessionId = -1;
        this.messages = [];
        if (this.container) {
            this.container.innerHTML = '';
        }
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
                let url = `https://web.kick.com/api/v2/channels/${this.channelId}/messages`;
                if (currentCursor) url += `?cursor=${currentCursor}`;
                else {
                    let targetTime = this.videoStartTime;
                    if (this.videoElement) targetTime = new Date(this.videoStartTime.getTime() + (this.videoElement.currentTime * 1000));
                    url += `?start_time=${targetTime.toISOString()}`;
                }
                let data = await fetchJson(url);
                if (!data) {
                    url = url.replace('web.kick.com', 'kick.com');
                    data = await fetchJson(url);
                }
                if (!data) { await new Promise(r => setTimeout(r, 2000)); continue; }
                if (this.activeSessionId !== sessionId) break;

                const msgs = data.messages || (data.data && data.data.messages) || [];
                if (msgs.length) {
                    msgs.forEach(msg => { if (!this.messages.some(m => m.id === msg.id)) this.messages.push(msg); });
                    this.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    if (this.videoElement) this.updateUI(this.videoElement.currentTime);
                }
                currentCursor = data.cursor || (data.data && data.data.cursor) || data.next_cursor;
                if (!currentCursor) { currentCursor = null; await new Promise(r => setTimeout(r, 2000)); }
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
                <span style="color:${msg.sender?.identity?.color || '#53fc18'};font-weight:bold;margin-right:5px;">${msg.sender?.username || 'User'}:</span>
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

function getVolumeIcon(volume) {
    if (volume <= 0) return ICONS.volumeMute;
    if (volume < 0.2) return ICONS.volumeLow;
    if (volume < 0.5) return ICONS.volumeMedium;
    return ICONS.volumeHigh;
}

async function unlockVideo(triggerElement) {
    if (isUnlocking) return;
    const container = triggerElement.closest('.relative.flex.flex-col');
    if (!container || container.dataset.kickUnlockerProcessing) return;

    const containerRect = container.getBoundingClientRect();
    const fallbackMinHeight = Math.max(
        Math.round(containerRect.height || 0),
        Math.round((containerRect.width || 0) * 9 / 16),
        360
    );

    container.style.width = '100%';
    container.style.minHeight = `${fallbackMinHeight}px`;

    if (containerRect.width > 0 && containerRect.height > 0) {
        container.style.aspectRatio = `${containerRect.width} / ${containerRect.height}`;
    } else {
        container.style.aspectRatio = '16 / 9';
    }

    if (activeChatController) {
        activeChatController.destroy();
        activeChatController = null;
    }
    if (activeHls) {
        activeHls.destroy();
        activeHls = null;
    }

    try {
        isUnlocking = true;

        // --- STEP 1: FULL WIPE & SPLASH ---
        container.innerHTML = `
            <div style="width:100%;height:100%;min-height:${fallbackMinHeight}px;background:#000;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:Inter,sans-serif;">
                <div style="font-size:24px;font-weight:bold;color:#53fc18;margin-bottom:8px;">🔓 Kick Unlocker</div>
                <div style="font-size:14px;color:rgba(255,255,255,0.7);">Searching stream...</div>
            </div>
        `;

        const pathParts = window.location.pathname.split('/').filter(Boolean);
        let channelSlug = null;
        let videoSlug = null;

        if (pathParts.length >= 3 && (pathParts[1] === 'video' || pathParts[1] === 'videos')) {
            channelSlug = pathParts[0];
            videoSlug = pathParts[2];
        } else if (pathParts.length >= 2 && pathParts[0] === 'video') {
            videoSlug = pathParts[1];
        } else if (pathParts.length >= 2 && pathParts[1] !== 'videos' && pathParts[1] !== 'video') {
            channelSlug = pathParts[0];
            videoSlug = pathParts[1];
        } else if (pathParts.length > 0) {
            channelSlug = pathParts[0];
            videoSlug = pathParts[pathParts.length - 1];
        }

        const resumeKey = getResumeKey(channelSlug || 'unknown', videoSlug || 'unknown');
        const playerSettingsKey = getPlayerSettingsKey(channelSlug || 'unknown', videoSlug || 'unknown');
        const savedPlayerSettings = loadPlayerSettings(playerSettingsKey);

        const result = await getVideoMetadata(channelSlug, videoSlug);
        if (!result) {
            container.innerHTML = `
              <div style="width:100%;height:100%;min-height:${fallbackMinHeight}px;background:#000;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:Inter,sans-serif;">
                  <div style="font-size:22px;color:#ff4444;font-weight:bold;margin-bottom:8px;">Stream Not Found</div>
                  <div style="font-size:13px;color:#aaa;margin-bottom:16px;">Could not retrieve video details.</div>
                  <button class="k-retry-btn" id="k-retry-unlock">Retry Stream</button>
              </div>`;
            const retryBtn = container.querySelector('#k-retry-unlock');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    delete container.dataset.kickUnlockerProcessing;
                    unlockVideo(triggerElement);
                });
            }
            return;
        }

        const streamUrl = await findStreamUrlFromMetadata(result);
        if (!streamUrl) {
            container.innerHTML = `
              <div style="width:100%;height:100%;min-height:${fallbackMinHeight}px;background:#000;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:Inter,sans-serif;">
                  <div style="font-size:22px;color:#ff4444;font-weight:bold;margin-bottom:8px;">Stream Not Found</div>
                  <div style="font-size:13px;color:#aaa;margin-bottom:16px;">Could not locate HLS stream URL for this video.</div>
                  <button class="k-retry-btn" id="k-retry-unlock">Retry Stream</button>
              </div>`;
            const retryBtn = container.querySelector('#k-retry-unlock');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    delete container.dataset.kickUnlockerProcessing;
                    unlockVideo(triggerElement);
                });
            }
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

        const startTime = new Date((result.video?.start_time || result.video?.created_at || '').replace(' ', 'T') + ((result.video?.start_time || result.video?.created_at || '').endsWith('Z') ? '' : 'Z'));
        const chatController = new ChatController(result.channelId, startTime, chatRoot);
        activeChatController = chatController;
        chatController.init(null);

        const finalUrl = streamUrl + (streamUrl.includes('?') ? '&' : '?') + 'kick_ts=' + Date.now();
        let videoParent = existingChat ? container : container.querySelector('#unlocker-video-area');

        // Build Custom Player UI
        const playerHTML = `
            <div id="k-player" style="width:100%;height:100%;position:relative;background:black;overflow:hidden;font-family:Inter,sans-serif;">
                <video id="k-video" playsinline style="width:100%;height:100%;object-fit:contain;"></video>
                <div id="k-loading" class="visible" aria-hidden="true">
                    <div class="k-loading-spinner"></div>
                </div>
                <div id="k-controls" style="position:absolute;bottom:0;left:0;width:100%;padding:20px 15px 10px 15px;background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);display:flex;flex-direction:column;opacity:0;transition:opacity 0.2s;">
                    <div id="k-track" style="width:100%;height:6px;padding:8px 0;background:rgba(255,255,255,0.3);background-clip:content-box;box-sizing:content-box;cursor:pointer;position:relative;margin-bottom:4px;border-radius:2px;">
                        <div id="k-track-tooltip">
                            <div id="k-track-tooltip-time">0:00</div>
                        </div>
                         <div id="k-progress" style="width:0%;height:100%;background:#53fc18;position:relative;border-radius:2px;"></div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <div style="display:flex;align-items:center;gap:15px;">
                            <button id="k-play" style="background:none;border:none;cursor:pointer;opacity:0.9;" aria-label="Play/Pause">${ICONS.play}</button>
                            <span id="k-time" style="font-size:13px;color:#ddd;font-variant-numeric:tabular-nums;">0:00 / 0:00</span>
                            <div id="k-volume-wrap">
                                <button id="k-volume-btn" type="button" aria-label="Mute volume">${ICONS.volumeHigh}</button>
                                <input id="k-volume" type="range" min="0" max="1" step="0.01" value="1">
                                <span id="k-volume-value">100%</span>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:15px;">
                            <button id="k-update-btn" type="button" title="Open latest update" style="display:none;">${ICONS.update}</button>
                            <div id="k-speed-wrap">
                                <button id="k-speed-btn" type="button">1x ▴</button>
                                <div id="k-speed-menu"></div>
                            </div>
                            <div id="k-quality-wrap">
                                <button id="k-quality-btn" type="button">Auto ▴</button>
                                <div id="k-quality-menu"></div>
                            </div>
                            <button id="k-fs" style="background:none;border:none;cursor:pointer;opacity:0.9;" aria-label="Fullscreen">${ICONS.maximize}</button>
                        </div>
                    </div>
                </div>
                <div id="k-seek-indicator" aria-hidden="true"></div>
                <button id="k-big-play" style="position:absolute;top:50%;left:50%;width:70px;height:70px;background:rgba(7,7,7,0.72);border-radius:50%;border:1px solid rgba(255,255,255,0.18);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;" aria-label="Play">
                    ${ICONS.bigPlay}
                </button>
            </div>
        `;

        videoParent.innerHTML = playerHTML;
        const pRoot = videoParent.querySelector('#k-player');
        const vid = videoParent.querySelector('#k-video');
        const controls = videoParent.querySelector('#k-controls');
        const btnPlay = videoParent.querySelector('#k-play');
        const btnFs = videoParent.querySelector('#k-fs');
        const btnUpdate = videoParent.querySelector('#k-update-btn');
        const btnBig = videoParent.querySelector('#k-big-play');
        const progressBar = videoParent.querySelector('#k-progress');
        const track = videoParent.querySelector('#k-track');
        const trackTooltip = videoParent.querySelector('#k-track-tooltip');
        const trackTooltipTime = videoParent.querySelector('#k-track-tooltip-time');
        const timeDisplay = videoParent.querySelector('#k-time');
        const qualWrap = videoParent.querySelector('#k-quality-wrap');
        const qualBtn = videoParent.querySelector('#k-quality-btn');
        const qualMenu = videoParent.querySelector('#k-quality-menu');
        const speedWrap = videoParent.querySelector('#k-speed-wrap');
        const speedBtn = videoParent.querySelector('#k-speed-btn');
        const speedMenu = videoParent.querySelector('#k-speed-menu');
        const seekIndicator = videoParent.querySelector('#k-seek-indicator');
        const loadingOverlay = videoParent.querySelector('#k-loading');

        const volumeWrap = videoParent.querySelector('#k-volume-wrap');
        const volumeButton = videoParent.querySelector('#k-volume-btn');
        const volumeSlider = videoParent.querySelector('#k-volume');
        const volumeValue = videoParent.querySelector('#k-volume-value');
        const initialVolume = Number.isFinite(savedPlayerSettings.volume) ? savedPlayerSettings.volume : 1;
        let seekIndicatorTimeout = null;
        let hasStartedPlayback = false;
        let loadingStateTimeout = null;
        let previousVolumeBeforeMute = initialVolume > 0 ? initialVolume : 1;

        const updateVolumeSliderVisual = (volume) => {
            const percent = Math.max(0, Math.min(100, Math.round(volume * 100)));
            volumeSlider.style.setProperty('--k-volume-percent', `${percent}%`);
            volumeValue.textContent = `${percent}%`;
            volumeButton.innerHTML = getVolumeIcon(volume);
            volumeButton.setAttribute('aria-label', percent === 0 ? 'Unmute volume' : 'Mute volume');
            volumeWrap.dataset.muted = percent === 0 ? 'true' : 'false';
        };

        const applyVolume = (volume, { persist = true } = {}) => {
            const normalizedVolume = Math.max(0, Math.min(1, Number(volume) || 0));
            if (normalizedVolume > 0) previousVolumeBeforeMute = normalizedVolume;

            vid.muted = normalizedVolume === 0;
            vid.volume = normalizedVolume;
            volumeSlider.value = String(normalizedVolume);
            updateVolumeSliderVisual(normalizedVolume);

            if (persist) {
                savePlayerSettings(playerSettingsKey, { volume: normalizedVolume });
            }
        };

        const setLoadingState = (isLoading, { immediate = false } = {}) => {
            clearTimeout(loadingStateTimeout);

            if (!isLoading) {
                loadingOverlay.classList.remove('visible');
                return;
            }

            if (immediate) {
                loadingOverlay.classList.add('visible');
                return;
            }

            loadingStateTimeout = setTimeout(() => {
                if (!vid.paused && !vid.ended) {
                    loadingOverlay.classList.add('visible');
                }
            }, 250);
        };

        const showSeekIndicator = (direction) => {
            seekIndicator.innerHTML = direction === 'forward' ? ICONS.forward : ICONS.backward;
            seekIndicator.dataset.direction = direction;
            seekIndicator.classList.remove('visible');
            void seekIndicator.offsetWidth;
            seekIndicator.classList.add('visible');
            clearTimeout(seekIndicatorTimeout);
            seekIndicatorTimeout = setTimeout(() => {
                seekIndicator.classList.remove('visible');
            }, 850);
        };

        const togglePlay = () => { if (vid.paused) vid.play(); else vid.pause(); };

        activePlayerUi = {
            vid,
            qualWrap,
            speedWrap,
            showSeekIndicator,
            togglePlay,
            toggleFullscreen: () => btnFs.click(),
            toggleMute: () => volumeButton.click(),
            applyVolume
        };
        bindGlobalPlayerListeners();

        applyVolume(initialVolume, { persist: false });

        // Speed Menu Setup
        const setSpeed = (rate, label) => {
            vid.playbackRate = rate;
            vid.preservesPitch = true;
            speedBtn.textContent = `${label} ▴`;
            [...speedMenu.querySelectorAll('.k-speed-option')].forEach((opt) => opt.classList.remove('active'));
            const matched = [...speedMenu.querySelectorAll('.k-speed-option')].find(opt => opt.textContent === label);
            if (matched) matched.classList.add('active');
            savePlayerSettings(playerSettingsKey, { speed: rate });
            speedWrap.classList.remove('open');
        };

        const speeds = [
            { rate: 0.5, label: '0.5x' },
            { rate: 0.75, label: '0.75x' },
            { rate: 1.0, label: '1x (Normal)' },
            { rate: 1.25, label: '1.25x' },
            { rate: 1.5, label: '1.5x' },
            { rate: 1.75, label: '1.75x' },
            { rate: 2.0, label: '2.0x' }
        ];

        speeds.forEach(sp => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'k-speed-option';
            item.textContent = sp.label;
            if (sp.rate === (savedPlayerSettings.speed || 1.0)) item.classList.add('active');
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                setSpeed(sp.rate, sp.label);
            });
            speedMenu.appendChild(item);
        });

        speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            qualWrap.classList.remove('open');
            speedWrap.classList.toggle('open');
        });

        const initialSpeed = savedPlayerSettings.speed || 1.0;
        const matchedSpeedObj = speeds.find(s => s.rate === initialSpeed) || speeds[2];
        setSpeed(matchedSpeedObj.rate, matchedSpeedObj.label);

        getLatestReleaseInfo().then((release) => {
            if (!release || !btnUpdate?.isConnected) return;

            btnUpdate.style.display = 'inline-flex';
            btnUpdate.title = `Update available: ${release.name || release.tagName}`;
            btnUpdate.addEventListener('click', () => {
                window.open(release.htmlUrl, '_blank', 'noopener,noreferrer');
            }, { once: true });
        });

        qualBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speedWrap.classList.remove('open');
            qualWrap.classList.toggle('open');
        });

        volumeSlider.addEventListener('input', () => {
            applyVolume(parseFloat(volumeSlider.value));
        });

        volumeButton.addEventListener('click', () => {
            if (vid.volume <= 0 || vid.muted) {
                applyVolume(previousVolumeBeforeMute > 0 ? previousVolumeBeforeMute : 1);
                return;
            }

            previousVolumeBeforeMute = vid.volume > 0 ? vid.volume : previousVolumeBeforeMute;
            applyVolume(0);
        });

        chatController.connectVideo(vid);

        vid.addEventListener('click', togglePlay);
        btnPlay.addEventListener('click', togglePlay);
        btnBig.addEventListener('click', togglePlay);
        vid.addEventListener('play', () => {
            btnPlay.innerHTML = ICONS.pause;
            btnBig.classList.remove('visible');
        });
        vid.addEventListener('pause', () => {
            btnPlay.innerHTML = ICONS.play;
            btnBig.classList.add('visible');
        });
        vid.addEventListener('playing', () => {
            hasStartedPlayback = true;
            setLoadingState(false);
        });
        vid.addEventListener('waiting', () => {
            if (!vid.paused) setLoadingState(true);
        });
        vid.addEventListener('seeking', () => {
            if (hasStartedPlayback) setLoadingState(true);
        });
        vid.addEventListener('seeked', () => {
            if (!vid.paused && vid.readyState >= 3) setLoadingState(false);
        });
        vid.addEventListener('canplay', () => {
            if (!vid.paused && hasStartedPlayback) setLoadingState(false);
        });
        vid.addEventListener('stalled', () => {
            if (!vid.paused) setLoadingState(true);
        });
        vid.addEventListener('loadeddata', () => {
            if (vid.paused && !hasStartedPlayback) setLoadingState(false);
        });
        vid.addEventListener('ended', () => setLoadingState(false));
        let lastSave = 0;
        
        vid.addEventListener('timeupdate', () => {
            if (Date.now() - lastSave > 4000) {
                localStorage.setItem(resumeKey, vid.currentTime);
                lastSave = Date.now();
            }
        
            if (isFinite(vid.duration)) {
                progressBar.style.width = (vid.currentTime / vid.duration * 100) + '%';
                timeDisplay.textContent = `${formatTime(vid.currentTime)} / ${formatTime(vid.duration)}`;
            }
        });
        vid.addEventListener('ended', () => {
            localStorage.removeItem(resumeKey);
        });

        let isDraggingTrack = false;
        const updateTrackPosition = (e) => {
            if (!isFinite(vid.duration)) return;
            const rect = track.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            vid.currentTime = ratio * vid.duration;
        };

        track.addEventListener('mousedown', (e) => {
            isDraggingTrack = true;
            updateTrackPosition(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDraggingTrack) {
                updateTrackPosition(e);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDraggingTrack) {
                isDraggingTrack = false;
            }
        });

        track.addEventListener('mousemove', (e) => {
            if (!isFinite(vid.duration)) return;
            const rect = track.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const hoverTime = ratio * vid.duration;

            trackTooltipTime.textContent = formatTime(hoverTime);
            trackTooltip.style.left = `${ratio * rect.width}px`;
            trackTooltip.classList.add('visible');
        });
        track.addEventListener('mouseenter', () => {
            if (isFinite(vid.duration)) trackTooltip.classList.add('visible');
        });
        track.addEventListener('mouseleave', () => {
            trackTooltip.classList.remove('visible');
        });

        let hideControlsTimeout = null;
        const showControls = () => {
            controls.style.opacity = '1';
            clearTimeout(hideControlsTimeout);
            if (!vid.paused) {
                hideControlsTimeout = setTimeout(() => {
                    if (!vid.paused && !qualWrap.classList.contains('open') && !speedWrap.classList.contains('open')) {
                        controls.style.opacity = '0';
                    }
                }, 2500);
            }
        };

        pRoot.addEventListener('mousemove', showControls);
        pRoot.addEventListener('mouseenter', showControls);
        pRoot.addEventListener('mouseleave', () => {
            qualWrap.classList.remove('open');
            speedWrap.classList.remove('open');
            trackTooltip.classList.remove('visible');
            if (!vid.paused) controls.style.opacity = '0';
        });

        btnFs.addEventListener('click', () => { if (!document.fullscreenElement) pRoot.requestFullscreen(); else document.exitFullscreen(); });
        vid.addEventListener('dblclick', () => btnFs.click());

        if (Hls.isSupported()) {
            const hls = new Hls({ debug: false, enableWorker: false, lowLatencyMode: true });
            activeHls = hls;
            hls.loadSource(finalUrl);
            hls.attachMedia(vid);
            hls.on(Hls.Events.MANIFEST_LOADING, () => setLoadingState(true, { immediate: true }));
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setLoadingState(false);
                const setQuality = (level, label, optionRef = null, qualitySettings = null) => {
                    hls.currentLevel = level;
                    qualBtn.textContent = `${label} ▴`;
                    [...qualMenu.querySelectorAll('.k-quality-option')].forEach((option) => option.classList.remove('active'));
                    if (optionRef) optionRef.classList.add('active');
                    if (qualitySettings) savePlayerSettings(playerSettingsKey, { quality: qualitySettings });
                    qualWrap.classList.remove('open');
                };

                const addQualityItem = (level, label, qualitySettings, isActive = false) => {
                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'k-quality-option';
                    item.textContent = label;
                    if (isActive) item.classList.add('active');
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        setQuality(level, label, item, qualitySettings);
                    });
                    qualMenu.appendChild(item);
                    return item;
                };

                const qualityItems = [];
                const autoItem = addQualityItem(-1, 'Auto', { mode: 'auto' }, true);

                hls.levels
                    .map((lvl, idx) => ({ lvl, idx }))
                    .sort((a, b) => (b.lvl.height || 0) - (a.lvl.height || 0))
                    .forEach(({ lvl, idx }) => {
                        qualityItems.push({
                            height: lvl.height,
                            level: idx,
                            label: `${lvl.height}p`,
                            element: addQualityItem(idx, `${lvl.height}p`, { mode: 'manual', height: lvl.height })
                        });
                    });

                const savedQuality = savedPlayerSettings.quality;
                if (savedQuality?.mode === 'manual') {
                    const matchedQuality = qualityItems.find((item) => item.height === savedQuality.height);
                    if (matchedQuality) {
                        setQuality(
                            matchedQuality.level,
                            matchedQuality.label,
                            matchedQuality.element,
                            { mode: 'manual', height: matchedQuality.height }
                        );
                    } else {
                        setQuality(-1, 'Auto', autoItem, { mode: 'auto' });
                    }
                } else {
                    setQuality(-1, 'Auto', autoItem, { mode: 'auto' });
                }

                vid.play().catch(() => btnBig.classList.add('visible'));
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
                if (data.fatal) setLoadingState(false);
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