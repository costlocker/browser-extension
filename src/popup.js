
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

function isFirefox() {
    return typeof browser !== "undefined";
}

function showPage(selectedPage) {
    const pages = document.getElementsByTagName('section');
    for(let i = 0; i < pages.length; i++) {
        const page = pages[i];
        page.className = page.id == selectedPage ? '' : 'hide';
    }
    if (selectedPage == 'page-tracking-start') {
        chrome.storage.local.get(
            {
                isSaveEnabled: true,
            },
            function (options) {
                reloadTrackingMode(options.isSaveEnabled);
                setPopupHeight();
            }
        );
    }
}

let runningEntry = null;
let externalIds = null;
let runningEntryInterval = null;
let trackingButton = document.getElementById('tracking-button');

function isRunning() {
    return runningEntry && runningEntry.uuid;
}

function countRunningSeconds(date) {
    return isRunning() ? dayjs().diff(date, 'seconds') : 0;
}

function getRunningDate() {
    return dayjs(runningEntry.date.replace('+0000', ''));
}

function reloadIcon(callback) {
    const status = isRunning() ? 'active' : 'inactive';
    chrome.browserAction.setIcon(
        { path: `../assets/icons/${status}-48x48.png` },
        callback
    );
}

onClick(
    '#tracking-stop',
    () => {
        sendApiCall(
            {
                method: 'POST',
                path: '/api-public/v2/timeentries/',
                data: {
                    uuid: runningEntry.uuid,
                    date: runningEntry.date,
                    description: document.getElementById('description-running').value,
                    duration: countRunningSeconds(getRunningDate()),
                    assignment: runningEntry.assignment
                }
            },
            function () {
                runningEntry = null;
                clearInterval(runningEntryInterval);
                reloadIcon();
                showPage('page-tracking-start');
            }
        );
    }
);

onClick(
    '[data-mode-toggle]',
    (element) => reloadTrackingMode(element.getAttribute('data-mode') == 'start')
);

function reloadTrackingMode(isSaveEnabled) {
    togglePageClass(isSaveEnabled, {
        true: 'save--enabled',
        false: 'save--disabled',
    });
};

onClick('[data-tracking-start]', () => saveTracking(true));
onClick('[data-tracking-save]', () => saveTracking(false));
clDurationInput(document.getElementById('duration-save'), convertSecondsToTime);

function saveTracking(isTrackingStarted) {
    const description = document.getElementById('description-start').value;
    const rawSeconds = parseInt(document.getElementById('duration-save').getAttribute('data-seconds'));
    const seconds = rawSeconds && rawSeconds > 0 ? rawSeconds : 0;
    const date = dayjs().subtract(seconds, 'second');
    saveRunningDescription(description);
    sendApiCall(
        {
            method: 'POST',
            path: '/api-public/v2/timeentries/',
            data: {
                date: date.format('YYYY-MM-DD HH:mm:ss'),
                duration: isTrackingStarted ? null : seconds,
                description: description,
                assignment: getSelectedAssignment(),
                external_ids: externalIds
            }
        },
        function () {
            runningEntry = { uuid: isTrackingStarted ? 'irrelevant uuid' : null };
            reloadIcon(closePopup);
        }
    );
}

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
                document.getElementById('project-running').innerHTML = renderAssignmentOption(runningEntry.names, 'class="choices__list--single"');
                showEditableRunningDescription(runningEntry.description);
                showRunningTime();
                if (runningEntryInterval) {
                    clearInterval(runningEntryInterval);
                }
                runningEntryInterval = setInterval(showRunningTime, 1000)
                showPage('page-tracking-stop');
            } else {
                showPage('page-tracking-start');
            }
        }
    );
    loadDataFromCurrentPage();
}

function showEditableRunningDescription(defaultDescription) {
    chrome.storage.local.get(
        { runningDescription: defaultDescription },
        function (data) {
            document.getElementById('description-running').value = data.runningDescription;
        }
    );
    document.getElementById('description-running').addEventListener('input', function () {
        saveRunningDescription(this.value);
    });
}

function saveRunningDescription(value) {
    if (value && value.length) {
        chrome.storage.local.set({ runningDescription: value });
    } else {
        chrome.storage.local.remove('runningDescription');
    }
}

function showRunningTime() {
    if (!isRunning()) {
        return;
    }
    const date = getRunningDate();
    const runningSeconds = countRunningSeconds(date);
    document.getElementById('duration-time').textContent = convertSecondsToTime(runningSeconds);
    document.getElementById('duration-time').setAttribute('title', date.format('YYYY-MM-DD HH:mm:ss'));
}

function convertSecondsToTime(seconds) {
    const time = new Date(null);
    time.setSeconds(seconds)
    return time.toISOString().substr(11, 8);
}

function closePopup() {
    window.close();
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
        searchFields: [
            'customProperties.task_name',
            'customProperties.project_name',
            'customProperties.activity_name',
            'customProperties.client_name',
        ],
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
    adaptPopupHeight('hideDropdown');
    if (isFirefox()) {
        adaptPopupHeight('showDropdown');
    }

    function adaptPopupHeight(event) {
        projectsSelect.addEventListener(
            event,
            () => setPopupHeight(event == 'showDropdown'),
            false
        );
    }
}

function setPopupHeight(isDropdownVisible) {
    togglePageClass(isDropdownVisible, {
        true: 'tracking-dropdown-show',
        false: 'tracking-dropdown-hide',
    });
}

function togglePageClass(value, options) {
    const boolean = value ? true : false;
    const css = document.body.parentElement.classList;
    css.remove(options[!boolean]);
    css.add(options[boolean]);
}

function renderAssignmentOption(unsafeNames, container) {
    if (!unsafeNames.project_name) {
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
    const names = escapeObject(unsafeNames);
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
    const select = document.getElementById('project-start');
    if (select.selectedIndex === -1) {
        return null;
    }
    const encodedAssignment = select[select.selectedIndex].value;
    return JSON.parse(encodedAssignment.replace(/'/g, '"'));
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
    logRuntimeError(`${tab.url} is not fully supported, page title is used`);
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

function logRuntimeError(message) {
    if (chrome.runtime.lastError) {
        // ignore runtime error (https://stackoverflow.com/a/28432087)
        console.log(message);
        console.log(`> Error [${chrome.runtime.lastError.message}]`);
    }
}

onClick('.open-costlocker', () => {
    chrome.tabs.create({url: 'https://new.costlocker.com/'});
    closePopup();
});
onClick('#close', closePopup);
onClick('#options', chrome.runtime.openOptionsPage);

function onClick(selector, handler) {
    document.querySelectorAll(selector).forEach(
        (element) => element.addEventListener('click', () => handler(element))
    );
}
