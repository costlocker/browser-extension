
chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg.from === 'popup' && msg.subject === 'CostlockerTimeEntry') {
        callback({
            id: null,
            description: getEventTitle(),
            external_ids: {
                url: window.location.href,
            }
        });
    }

    function getEventTitle() {
        const element = document.querySelector('div[role=dialog] [role=heading]');
        return element ? element.textContent.trim() : document.title;
    }
});
