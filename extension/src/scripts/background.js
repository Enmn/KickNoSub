// Background Service Worker
console.log("Kick Unlocker: Background service worker started");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "CHECK_STREAM_URL") {
        checkUrlAsync(message.url).then(isValid => {
            sendResponse({ valid: isValid });
        });
        return true; // Keep the messaging channel open
    }
});

async function checkUrlAsync(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
    } catch (e) {
        // console.warn("Background fetch failed for", url, e);
        return false;
    }
}