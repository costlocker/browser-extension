
function sendApiCall(settings, callback) {
    chrome.runtime.sendMessage(
        {
            type: 'api',
            call: settings,
        },
        function (data) {
            if (data.status == 200) {
                showPage('page-tracking');
                callback(data.json);
            } else if (data.status == 401) {
                showPage('page-login');
            } else {
                showPage('page-error');
                document.getElementById('error-message').textContent = JSON.stringify(data.json, null, 2);
            }
        }
    );
}

function showPage(selectedPage) {
    ['page-loading', 'page-tracking', 'page-error', 'page-login'].forEach(page => {
        document.getElementById(page).className = page == selectedPage ? '' : 'hide';
    });
}

let runningEntry = null;
let externalIds = null;
let trackingButton = document.getElementById('tracking-button');

function isRunning() {
    return runningEntry && runningEntry.uuid;
}

function reloadIcon() {
    const status = isRunning() ? 'active' : 'inactive';
    chrome.browserAction.setIcon({
        path: `../assets/icons/${status}-48x48.png`
    });
}

trackingButton.onclick = function () {
    const entries = [];
    if (isRunning()) {
        entries.push({
            uuid: runningEntry.uuid,
            date: runningEntry.dt,
            duration: dayjs().diff(dayjs(runningEntry.dt), 'seconds'),
            debug: runningEntry
        });
    }
    entries.push({
        date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        duration: null,
        description: document.getElementById('description').value,
        assignment: null,
        external_ids: externalIds
    });
    sendApiCall(
        {
            method: 'POST',
            path: '/api-public/v2/timeentries/',
            data: {
                data: entries
            }
        },
        function (data) {
            runningEntry = data.data[entries.length - 1];
            reloadIcon();
            window.close();
        }
    );
};

window.addEventListener('DOMContentLoaded', loadTracking);

function loadTracking () {
    showPage('page-loading');
    sendApiCall(
        {
            method: 'GET',
            path: '/api/running-entry',
        },
        function (data) {
            runningEntry = data;
            reloadIcon();
            showPage('page-tracking');
        }
    );
    loadDataFromCurrentPage();
}

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
    externalIds = data.external_ids;
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
