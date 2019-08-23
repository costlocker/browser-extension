
chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg.from === 'popup' && msg.subject === 'CostlockerTimeEntry') {
        const issue = getIssue();
        callback({
            id: issue,
            description: getCardTitle(),
            external_ids: {
                url: window.location.href,
                issue: issue,
            }
        });
    }

    function getCardTitle() {
        const element = document.querySelector('.issue-header #summary-val');
        return element ? element.textContent : document.title;
    }

    function getIssue() {
        const element = document.querySelector('.issue-header [data-issue-key]');
        if (!element) {
            return null;
        }
        return element.getAttribute('data-issue-key');
    }
});
