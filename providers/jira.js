
chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg.from === 'popup' && msg.subject === 'CostlockerTimeEntry') {
        const keys = parseKey();
        callback({
            id: keys.id,
            description: getCardTitle(),
            external_ids: {
                url: window.location.href,
                project: keys.project,
            }
        });
    }

    function getCardTitle() {
        const element = document.querySelector('.issue-header #summary-val');
        return element ? element.textContent : document.title;
    }

    function parseKey() {
        const element = document.querySelector('.issue-header [data-issue-key]');
        if (!element) {
            return {
                key: null,
                project: null,
            };
        }
        const key = element.getAttribute('data-issue-key');
        return {
            id: key,
            project: key.split('-')[0],
        };
    }
});
