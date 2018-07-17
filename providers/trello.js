
chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg.from === 'popup' && msg.subject === 'CostlockerTimeEntry') {
        const page = parseUrl();
        callback({
            id: '#' + page.shortId,
            description: getCardTitle(),
            url: page.url,
            external_ids: {
                cardShortId: page.shortId,
                boardShortLink: getBoardShortLink(),
            }
        });
    }
    
    function parseUrl() {
        const urlParts = window.location.href.split('/');
        const slug = urlParts.pop();    
        return {
            url: urlParts.join('/'),
            shortId: slug.split('-').shift(),
        }
    }

    function getCardTitle() {
        const element = document.querySelector('.window-title h2');
        return element ? element.textContent : document.title;
    }
    
    function getBoardShortLink() {
        const element = document.querySelector('.js-recent-boards a.js-open-board');
        return element ? element.getAttribute('href').split('/')[2] : null;
    }
});
