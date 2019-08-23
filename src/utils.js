
function isFirefox() {
    return typeof browser !== "undefined";
}

function escapeObject(names) {
    const escaped = {};
    for (var key in names) {
        escaped[key] = names[key] !== null ? escape(names[key]) : names[key];
    }
    return escaped;
}

function escape(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
