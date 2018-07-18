chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg.type === "api") {
        const manifest = chrome.runtime.getManifest();
        const apiHost = manifest.permissions[manifest.permissions.length - 1].replace('/*', '');
        const url = `${apiHost}${msg.path}?v=ext-${manifest.version}`;
        chrome.cookies.get(
            {
                url: url,
                name: 'XSRF-TOKEN'
            },
            function (cookie) {
                if (!cookie) {
                    return callback({
                        isOk: false,
                        json: {
                            message: 'Not Authorized'
                        }
                    });
                }
                const call = {
                    url: url,
                    settings: {
                        method: msg.method,
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include'    
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
                        isOk: true,
                        json: json
                    }))
                    .catch(error => Promise.resolve(error.json).then(json => {
                        callback({
                            isOk: true,
                            json: json,
                        });
                    }));
            }
        );
        return true;
    }
});
