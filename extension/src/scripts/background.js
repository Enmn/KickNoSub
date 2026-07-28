// Background Service Worker
console.log("Kick Unlocker: Background service worker started");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "CHECK_STREAM_URL") {
        checkUrlAsync(message.url).then(isValid => {
            sendResponse({ valid: isValid });
        });
        return true; // Keep the messaging channel open
    }

    if (message.action === "FETCH_JSON") {
        fetchJsonAsync(message.url).then(data => {
            sendResponse({ data });
        }).catch(() => {
            sendResponse({ data: null });
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

function isAllowedKickApiUrl(url) {
    try {
        const parsedUrl = new URL(url);
        const isKickHost = parsedUrl.hostname === 'kick.com' || parsedUrl.hostname.endsWith('.kick.com');
        return parsedUrl.protocol === 'https:' && isKickHost && parsedUrl.pathname.startsWith('/api/');
    } catch (e) {
        return false;
    }
}

async function fetchJsonAsync(url) {
    if (!isAllowedKickApiUrl(url)) return null;

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
        // console.warn("Background fetch failed for", url, e);
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
