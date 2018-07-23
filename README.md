
# Costlocker browser extension

Costlocker Tracking Button enables tracking time from any web tool

## Install extension

* ~~[Chrome]()~~
* ~~[Firefox]()~~

## Supported tools

* [Trello](https://trello.com/)
* [JIRA](https://www.atlassian.com/software/jira)
* [Google Calendar](https://www.google.com/calendar)
* any page _(page title is used)_

## Changelog

#### 2018.07.23

* Chrome/Firefox extension
* _providers:_ Trello, JIRA, Google Calendar, any page

---

## Development

```bash
git clone https://github.com/costlocker/browser-extension.git
cd browser-extension
```

### [Chrome](https://developer.chrome.com/extensions)

```bash
ln -sf manifest-chrome.json manifest.json
```

1. [chrome://extensions](chrome://extensions)
1. Developer Mode
1. Load Unpacked Extension

### [Firefox](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Porting_a_Google_Chrome_extension)

```bash
ln -sf manifest-firefox.json manifest.json
```

1. [about:debugging](about:debugging)
1. Load Temporary Add-on
