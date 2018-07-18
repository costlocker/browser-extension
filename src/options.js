
document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

function restore() {
    chrome.storage.local.get(
        {
            idBeforeDescription: true,
            idPrefix: '',
            idSuffix: '',
        },
        function (items) {
            document.getElementById('id_before_description').checked = items.idBeforeDescription;
            document.getElementById('id_prefix').value = items.idPrefix;
            document.getElementById('id_suffix').value = items.idSuffix;
        }
    );
}

function save() {
    chrome.storage.local.set(
        {
            idBeforeDescription: document.getElementById('id_before_description').checked,
            idPrefix: document.getElementById('id_prefix').value,
            idSuffix: document.getElementById('id_suffix').value
        },
        function () {
            window.close();
        }
    );
}
