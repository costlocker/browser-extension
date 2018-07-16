
chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg.from === 'popup' && msg.subject === 'CostlockerTimeEntry') {
        const url = window.location.href.split('/');
        const slug = url.pop();    
        callback({
            id: '#' + slug.split('-').shift(),
            title: document.querySelector('.window-title h2').textContent,
            url: url.join('/')
        });
    }
});
