
# Costlocker browser extension

Costlocker Tracking Button enables tracking time from any web tool

## Install extension

* [Chrome](https://chrome.google.com/webstore/detail/ihdpfkpefjcjfhciiagefbpeangdpfnh)
* [Firefox](https://addons.mozilla.org/addon/costlocker-tracking-button/)

## Supported tools

* [Trello](https://trello.com/)
* [JIRA](https://www.atlassian.com/software/jira)
* [Google Calendar](https://www.google.com/calendar)
* any page _(page title is used)_

## Changelog

#### 2018.7.27

* Fix searched fields for assignment
* Don't forget changes in running description

#### 2018.7.24

* Add running tracking duration
* Fix changing icon when time-tracking is started
* Prevent XSS attacks in assignment
* _Chrome:_ fix authenticating in incognito mode

#### 2018.7.23

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
