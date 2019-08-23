
chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg.from === 'popup' && msg.subject === 'CostlockerTimeEntry') {
        const page = parseUrl();
        callback({
            id: page.shortId,
            description: getCardTitle(),
            external_ids: {
                url: page.url,
                cardShortId: page.shortId,
                boardProject: getBoardProject(), // shortBoardId would be better, but it's hard to detect it
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
    
    function getBoardProject() {
        const project = document.querySelector('.board-header-btn-text');
        return project ? project.textContent.trim() : null;
    }
});
