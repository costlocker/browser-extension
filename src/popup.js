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
    chrome.storage.local.get(
        {
            idBeforeDescription: true,
            idPrefix: '',
            idSuffix: '',
        },
        function (options) {
            let description = data.description;
            if (data.id && options.idBeforeDescription) {
                const prefix = options.idPrefix ? options.idPrefix : '';
                const suffix = options.idSuffix ? options.idSuffix : '';
                description = `${prefix}${data.id}${suffix} ${description}`;
            }
            document.getElementById('description').value = description;
        }
    );
    document.getElementById('app-debug').textContent = JSON.stringify(data, null, 2);
}

document.querySelector('#go-to-options').onclick = function() {
    chrome.runtime.openOptionsPage();
};
