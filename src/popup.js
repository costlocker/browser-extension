let isTrackingRunning = false;
let trackingButton = document.getElementById('tracking-button');
trackingButton.onclick = function () {
    isTrackingRunning = !isTrackingRunning;
    chrome.browserAction.setIcon(getIcons(isTrackingRunning));
};

function getIcons (isTrackingRunning) {
    const status = isTrackingRunning ? 'active' : 'inactive';
    return {
        path: `assets/icons/${status}-48x48.png`
    };
}

window.addEventListener('DOMContentLoaded', loadDataFromCurrentPage);

function loadDataFromCurrentPage() {
    chrome.tabs.query(
        { active: true, currentWindow: true },
        function (tabs) {
            const tab = tabs[0];
            chrome.tabs.sendMessage(
                tab.id,
                { from: 'popup', subject: 'CostlockerTimeEntry' },
                (data) => {
                    loadTimeentryFromPage(data, tab);
                }
            );
        }
    );
}

function loadTimeentryFromPage(data, tab) {
    if (!data) {
        data = anyPageProvider(tab);
    }
    document.getElementById('app-debug').textContent = JSON.stringify(data, null, 2);
}
