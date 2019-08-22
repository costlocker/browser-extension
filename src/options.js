
document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

function restore() {
    chrome.storage.local.get(
        {
            idBeforeDescription: true,
            idPrefix: '',
            idSuffix: '',
            isSaveEnabled: false,
        },
        function (items) {
            document.getElementById('id_before_description').checked = items.idBeforeDescription;
            document.getElementById('id_prefix').value = items.idPrefix;
            document.getElementById('id_suffix').value = items.idSuffix;
            document.getElementById('is_save_enabled').checked = items.isSaveEnabled;
        }
    );
}

function save() {
    chrome.storage.local.set(
        {
            idBeforeDescription: document.getElementById('id_before_description').checked,
            idPrefix: document.getElementById('id_prefix').value,
            idSuffix: document.getElementById('id_suffix').value,
            isSaveEnabled: document.getElementById('is_save_enabled').checked,
        },
        function () {
            window.close();
        }
    );
}
