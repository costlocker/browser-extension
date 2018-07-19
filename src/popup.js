
function sendApiCall(settings, callback) {
    chrome.runtime.sendMessage(
        {
            type: 'api',
            call: settings,
        },
        function (data) {
            if (data.status == 200) {
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
    const pages = document.getElementsByTagName('section');
    for(let i = 0; i < pages.length; i++) {
        const page = pages[i];
        page.className = page.id == selectedPage ? '' : 'hide';
    }
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

document.getElementById('tracking-stop').onclick = function () {
    sendApiCall(
        {
            method: 'POST',
            path: '/api-public/v2/timeentries/',
            data: {
                uuid: runningEntry.uuid,
                date: runningEntry.date,
                description: document.getElementById('description-running').value,
                duration: dayjs().diff(dayjs(runningEntry.date.replace('+0000', '')), 'seconds'),
                assignment: runningEntry.assignment
            }
        },
        function (data) {
            runningEntry = null;
            reloadIcon();
            showPage('page-tracking-start');
        }
    );
};

document.getElementById('tracking-start').onclick = function () {
    sendApiCall(
        {
            method: 'POST',
            path: '/api-public/v2/timeentries/',
            data: {
                date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                duration: null,
                description: document.getElementById('description-start').value,
                assignment: getSelectedAssignment(),
                external_ids: externalIds
            }
        },
        function (data) {
            runningEntry = data.data[data.data.length - 1];
            reloadIcon();
            window.close();
        }
    );
};

window.addEventListener('DOMContentLoaded', showPopup);

function showPopup () {
    showPage('page-loading');
    sendApiCall(
        {
            method: 'POST',
            path: '/api-public/v1',
            data: {
                Simple_Tracking_RunningEntry: {},
                Simple_Tracking_Assignments: {}
            }
        },
        function (data) {
            runningEntry = data.Simple_Tracking_RunningEntry;
            reloadIcon();
            loadAssignments(data.Simple_Tracking_Assignments);
            if (isRunning()) {
                document.getElementById('project-running').value = assignmentToString(runningEntry);
                document.getElementById('description-running').value = runningEntry.description;
                showPage('page-tracking-stop');
            } else {
                showPage('page-tracking-start');
            }
        }
    );
    loadDataFromCurrentPage();
}

function loadAssignments(availableAssignments) {
    const projectsSelect = document.getElementById('project-start');
    projectsSelect.innerHTML = '';
    availableAssignments.forEach((item, index) => {
        const option = new Option(assignmentToString(item), index);
        option.setAttribute('data-assignment', JSON.stringify(item.assignment));
        projectsSelect.options[index] = option;
    });
}

function assignmentToString(item) {
    if (!item.assignment.project_id) {
        return '[No project]';
    }
    const task = item.assignment.task_id ? ` - ${item.names.task_name}` : '';
    return `${item.names.project_name} (${item.names.client_name}) - ${item.names.activity_name}${task}`;
}

function getSelectedAssignment() {
    return JSON.parse(getSelectedOption().getAttribute('data-assignment'));
}

function getSelectedOption() {
    const select = document.getElementById('project-start');
    return select[select.selectedIndex || 0] || {
        getAttribute: () => null
    };
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
            document.getElementById('description-start').value = description;
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
