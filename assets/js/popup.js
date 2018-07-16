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
