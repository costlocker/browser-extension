
chrome.contextMenus.create({
    "title": "Start tracking: '%s'",
    "contexts": ["selection"],
    "onclick": function (info) {
        console.log(info.selectionText);
        // cannot open popup: https://stackoverflow.com/a/33362655
    }
});
