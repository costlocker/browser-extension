chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg.type === "api") {
        processApiCall(msg.call, callback);
        return true;
    }
});

function processApiCall(settings, callback) {
    const manifest = chrome.runtime.getManifest();
    const apiHost = manifest.permissions[manifest.permissions.length - 1].replace('/*', '');
    const url = `${apiHost}${settings.path}?v=ext-${manifest.version}`;
    chrome.cookies.get(
        {
            url: url,
            name: 'XSRF-TOKEN'
        },
        function (cookie) {
            if (!cookie) {
                return callback({
                    status: 401,
                    json: {
                        message: 'Not Authorized'
                    }
                });
            }
            const call = {
                url: url,
                settings: {
                    method: settings.method,
                    headers: {
                      'Content-Type': 'application/json',
                      'X-XSRF-TOKEN': cookie.value
                    },
                    credentials: 'include',
                    body: settings.data ? JSON.stringify(settings.data) : undefined,
                }
            };
            fetch(call.url, call.settings)
                .then(response => {
                    if (!response.ok) {
                        const error = new Error('Invalid API response');
                        error.status = response.status;
                        error.stack = `${response.url}\n${response.status} ${response.statusText}`;
                        error.json = response.json();
                        throw error;
                    }
                    return response.json();
                })
                .then(json => callback({
                    status: 200,
                    json: json
                }))
                .catch(error => Promise.resolve(error.json).then(json => {
                    callback({
                        status: json.errors && json.errors[0].status == 403 || json.type == 'LoggedOut' ? 401 : 400,
                        json: json,
                    });
                }));
        }
    );
}