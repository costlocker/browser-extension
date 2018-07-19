
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
    projectsSelect.options[0] = new Option('[No project]', '', true);

    groupAssignmentsByProject().forEach((item, index) => {
        const option = new Option(item.name, item.project_id);
        option.setAttribute('data-items', JSON.stringify(item.items));
        projectsSelect.options[index + 1] = option;
    });
    projectsSelect.addEventListener('change', reloadAssignmentsForSelectedProject);

    function groupAssignmentsByProject() {
        const projects = [];
        const mapping = {};
        availableAssignments.forEach((item, index) => {
            if (!mapping[item.assignment.project_id]) {
                mapping[item.assignment.project_id] = projects.length;
                projects[projects.length] = {
                    project_id: item.assignment.project_id,
                    name: `${item.names.project_name} (${item.names.client_name})`,
                    items: [],
                };
            }
            const task = item.assignment.task_id ? ` - ${item.names.task_name}` : '';
            projects[mapping[item.assignment.project_id]].items.push({
                name: `${item.names.activity_name} ${task}`,
                activity_id: item.assignment.activity_id,
                task_id: item.assignment.task_id,
            });
        });
        return projects;
    }

    function reloadAssignmentsForSelectedProject() {
        const items = JSON.parse(getSelectedOption('project-start').getAttribute('data-items')) || [];

        const assignmentSelect = document.getElementById('activity-start');
        assignmentSelect.innerHTML = '';
        items.forEach((item, index) => {
            const option = new Option(item.name, item.project_id, false, index == 0);
            option.setAttribute('data-activity', item.activity_id || '');
            option.setAttribute('data-task', item.task_id || '');
            assignmentSelect.options[index] = option;
        });
        assignmentSelect.disabled = items.length <= 1;
    }
}

function getSelectedAssignment() {
    const selectedProject = getSelectedOption('project-start');
    const selectedActivity = getSelectedOption('activity-start');
    return {
        project_id: selectedProject.value || null,
        activity_id: selectedActivity.getAttribute('data-activity') || null,
        task_id: selectedActivity.getAttribute('data-task') || null
    };
}

function getSelectedOption(id) {
    const select = document.getElementById(id);
    return select[select.selectedIndex || 0] || {
        value: null,
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
