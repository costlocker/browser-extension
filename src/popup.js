
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
                document.getElementById('project-running').innerHTML = renderAssignmentOption(runningEntry.names, 'class="choices__inner"');
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

    const options = [];
    availableAssignments.forEach((item, index) => {
        options.push({
            value: JSON.stringify(item.assignment).replace(/"/g, "'"),
            label: assignmentToString(item),
            selected: index == 0,
            customProperties: item.names,
        })
    });

    const choices = new Choices(projectsSelect, {
        choices: options,
        maxItemCount: 1,
        searchResultLimit: 5,
        position: 'bottom',
        callbackOnCreateTemplates: function (template) {
            var classNames = this.config.classNames;
            const render = (buildContainer) => {
                return (data) => template(renderAssignmentOption(data.customProperties, buildContainer(data)));
            };
            return {
              item: render((data) => `class="${classNames.item} ${data.highlighted ? classNames.highlightedState : classNames.itemSelectable}" data-item data-id="${data.id}" data-value="${data.value}" ${data.active ? 'aria-selected="true"' : ''} ${data.disabled ? 'aria-disabled="true"' : ''}`),
              choice: render((data) => `class="${classNames.item} ${classNames.itemChoice} ${data.disabled ? classNames.itemDisabled : classNames.itemSelectable}" data-select-text="${this.config.itemSelectText}" data-choice ${data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable'} data-id="${data.id}" data-value="${data.value}" ${data.groupId > 0 ? 'role="treeitem"' : 'role="option"'}`),
            };
        },
    });    
    projectsSelect.addEventListener(
        'hideDropdown',
        function(event) {
            document.body.parentElement.className = 'tracking-window'; // hack for popup height
        },
        false
    );
}

function renderAssignmentOption(names, container) {
    if (!names.project_name) {
        return `
            <div ${container}>
                <div class="timesheet-task-search__project">
                    [No project]
                </div>
                <div class="timesheet-task-search__activity-task">
                    Select a task...
                </div>
            </div>
        `;
    }
    const task = names.task_name !== null ? ` - ${names.task_name}` : '';
    return `
        <div ${container}>
            <div class="timesheet-task-search__project">
                <span class="timesheet-task-search__client">${names.client_name}</span> ${names.project_name}
            </div>
            <div class="timesheet-task-search__activity-task">
                ${names.activity_name} ${task}
            </div>
        </div>
    `;
}

function assignmentToString(item) {
    if (!item.assignment.project_id) {
        return '';
    }
    const task = item.assignment.task_id ? ` - ${item.names.task_name}` : '';
    return `${item.names.project_name} (${item.names.client_name}) - ${item.names.activity_name}${task}`;
}

function getSelectedAssignment() {
    return JSON.parse(getSelectedOption().replace(/'/g, '"'));
}

function getSelectedOption() {
    const select = document.getElementById('project-start');
    return select[select.selectedIndex || 0].value;
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
