// Background Service Worker
console.log("Kick Unlocker: Background service worker started");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "CHECK_STREAM_URL") {
        checkUrlAsync(message.url).then(isValid => {
            sendResponse({ valid: isValid });
        });
        return true; // Keep the messaging channel open
    }

    if (message.action === 'FETCH_JSON') {
        fetchJsonAsync(message.url).then(data => {
            sendResponse({ data });
        }).catch(() => {
            sendResponse({ data: null });
        });
        return true;
    }

    if (message.action === 'MINT_PLAYBACK') {
        mintPlaybackAsync(message.videoId, message.urlPath).then(vod => {
            sendResponse({ vod: vod || null });
        });
        return true;
    }

    if (message.action === "GET_LATEST_RELEASE") {
        getLatestReleaseAsync().then((release) => {
            sendResponse({ release });
        }).catch(() => {
            sendResponse({ release: null });
        });
        return true;
    }
});

async function fetchJsonAsync(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*'
            },
            cache: 'no-store'
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        return null;
    }
}

async function checkUrlAsync(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function getLatestReleaseAsync() {
    try {
        const response = await fetch('https://api.github.com/repos/Enmn/KickNoSub/releases/latest', {
            headers: {
                'Accept': 'application/vnd.github+json'
            },
            cache: 'no-store'
        });

        if (!response.ok) return null;

        const data = await response.json();
        return {
            tagName: data.tag_name,
            htmlUrl: data.html_url,
            name: data.name
        };
    } catch (e) {
        return null;
    }
}

// Mirrors the kick.com web player: mints a playback URL for a VOD.
// Returns playback_url.vod (master manifest) or null (e.g. subscriber-only
// video without an entitled session).
async function mintPlaybackAsync(videoId, urlPath) {
    try {
        const response = await fetch(`https://web.kick.com/api/v1/stream/${videoId}/playback`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_player: {
                    player: {
                        player_name: 'web',
                        player_version: '1.0.0',
                        player_software: 'IVS Player',
                        player_software_version: '1.28.0'
                    },
                    mux_sdk: { sdk_available: false },
                    pal_sdk: { sdk_available: false, nonce: '' },
                    datazoom_sdk: { sdk_available: false, datazoom_sdk_version: '', om_sdk_version: '' },
                    google_ads_sdk: { sdk_available: false }
                },
                video_session: {
                    page_type: 'vod',
                    player_remote_played: false,
                    enable_sampling: false,
                    url_path: urlPath || `/channel/videos/${videoId}`,
                    autoplay_behaviour: 'auto',
                    play_muted: false,
                    viewer_connection_type: ''
                },
                user_session: {
                    session_id: '',
                    player_device_id: 'unknown',
                    browser_lang: navigator.language || 'en-US',
                    non_personalised_ads: false,
                    ad_targeting: ''
                }
            }),
            cache: 'no-store'
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data?.playback_url?.vod || null;
    } catch (e) {
        return null;
    }
}