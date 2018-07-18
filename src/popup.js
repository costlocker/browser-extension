let isTrackingRunning = false;
let trackingButton = document.getElementById('tracking-button');
trackingButton.onclick = function () {
    isTrackingRunning = !isTrackingRunning;
    chrome.browserAction.setIcon(getIcons(isTrackingRunning));
    sendApiCall(
        {
            method: 'GET',
            path: '/api/running-entry',
        },
        function (data) {
            document.getElementById('api-debug').textContent = JSON.stringify(data, null, 2);
        }
    );
};

function sendApiCall(settings, callback) {
    chrome.runtime.sendMessage(
        {
            type: 'api',
            call: settings,
        },
        function (data) {
            if (data.status == 200) {
                showPage('page-tracking');
                callback(data);
            } else if (data.status == 401) {
                showPage('page-login');
            } else {
                showPage('page-error');
                document.getElementById('error-message').textContent = data.json.message || '';
            }
        }
    );
}

function showPage(selectedPage) {
    ['page-tracking', 'page-error', 'page-login'].forEach(page => {
        document.getElementById(page).className = page == selectedPage ? '' : 'hide';
    });
}

function getIcons (isTrackingRunning) {
    const status = isTrackingRunning ? 'active' : 'inactive';
    return {
        path: `../assets/icons/${status}-48x48.png`
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

document.querySelectorAll('.open-costlocker').forEach(
    link => link.addEventListener('click', function() {
        chrome.tabs.create({url: 'https://new.costlocker.com/'});
        window.close();
    }
));
document.querySelector('#close').addEventListener('click', function() {
    window.close();
});
document.querySelector('#options').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
});
