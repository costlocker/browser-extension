
function clDurationInput(input, secondsToText) {
    const parser = clDurationParser();
    input.placeholder = '0 sec';
    input.setAttribute('data-seconds', 0);
    input.onfocus = () => {
        input.select();
    };
    input.onblur = () => {
        const seconds = parser(input.value);
        if (seconds && seconds > 0) {
            input.setAttribute('data-seconds', seconds);
            input.setAttribute('title', input.value);
            input.value = secondsToText(seconds);
        } else {
            input.clearDuration(`Unknown format: ${input.value}`);
        }
    };
    input.clearDuration = (title) => {
        input.setAttribute('data-seconds', 0);
        input.setAttribute('title', title || '');
        input.value = "";
    }
}

function clDurationParser() {
    const patterns = [
        // ^ <FLOAT> $
        {
            p: /^(\d*)(\s*[.,]\s*)?(\d+)$/,
            h: function (m) {
                const v = parseFloat(m[2] ? m[1] + '.' + m[3] : m[1] + m[3]);
                return v < 10 ? 3600 * v : 60 * v;
            }
        },
        // ^ <FLOAT> <HR> $
        {
            p: /^(\d*)(\s*[.,]\s*)?(\d+)\s*(h|hr|hrs|hour|hours|hod|hodin|hodiny)$/,
            h: function (m) {
                return 3600 * parseFloat(m[2] ? m[1] + '.' + m[3] : m[1] + m[3]);
            }
        },
        // ^ <FLOAT> <MIN> $
        {
            p: /^(\d*)(\s*[.,]\s*)?(\d+)\s*(m|mi|min|mins|minute|minutes|minut|minuty)$/,
            h: function (m) {
                return 60 * parseFloat(m[2] ? m[1] + '.' + m[3] : m[1] + m[3]);
            }
        },
        // ^ <INT> <SEC> $
        {
            p: /^(\d+)\s*(s|se|sec|secs|second|seconds|sek|sekund|sekundy)$/,
            h: function (m) {
                return parseFloat(m[1]);
            }
        },
        // ^ <INT> <MD> $
        {
            p: /^(\d+)\s*(md|manday|man-day)$/,
            h: function (m) {
                return 8 * 3600 * parseFloat(m[1]);
            }
        },
        // ^ <INT> ( : | <HR> ) <INT> ( : <MIN> ) <INT> [ <SEC> ] $ = HH:MM:SS
        {
            p: /^(\d+)\s*(:|h|hr|hrs|hour|hours|hod|hodin|hodiny)\s*(\d+)\s*(:|m|mi|min|mins|minute|minutes|minut|minuty)\s*(\d+)\s*(s|se|sec|secs|second|seconds|sek|sekund|sekundy)?$/,
            h: function (m) {
                return 3600 * parseFloat(m[1]) + 60 * parseFloat(m[3]) + parseFloat(m[5]);
            }
        },
        // <INT> <MIN> <INT> [ <SEC> ] $ = MM : SS
        {
            p: /^(\d+)\s*(m|mi|min|mins|minute|minutes|minut|minuty)\s*(\d+)\s*(s|se|sec|secs|second|seconds|sek|sekund|sekundy)?$/,
            h: function (m) {
                return 60 * parseFloat(m[1]) + parseFloat(m[3]);
            }
        },
        // <INT> : <INT> <MIN> $ = MM : SS
        {
            p: /^(\d+)\s*(:)\s*(\d+)\s*(m|mi|min|mins|minute|minutes|minut|minuty)$/,
            h: function (m) {
                return 60 * parseFloat(m[1]) + parseFloat(m[3]);
            }
        },
        // <INT> [ <HR> ] : <INT> [ <MIN> ] $ = HH : MM
        {
            p: /^(\d+)\s*(:|h|hr|hrs|hour|hours|hod|hodin|hodiny)\s*(\d+)\s*(m|mi|min|mins|minute|minutes|minut|minuty)?$/,
            h: function (m) {
                return 3600 * parseFloat(m[1]) + 60 * parseFloat(m[3]);
            }
        }
    ];

    return function (value) {
        if (!(typeof value === 'string' || value instanceof String)) {
            return undefined;
        }
        const string = value.toLocaleLowerCase().replace(/^\s+|\s+$/g, '');
        for (const i in patterns) {
            const match = string.match(patterns[i].p);
            if (match) {
                return Math.round(patterns[i].h(match));
            }
        }
        return undefined;
    }
}
