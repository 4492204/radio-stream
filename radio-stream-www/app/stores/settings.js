import loggerCreator from '../utils/logger'
//noinspection JSUnresolvedVariable
var moduleLogger = loggerCreator(__filename);

import { observable, action } from "mobx";

class Settings {

    @observable playPauseKey = null;

    host = null;
    password = null;

    _electronSettings = require('electron-settings');

    constructor() {
        let logger = loggerCreator(this.constructor.name, moduleLogger);
        logger.info(`start`);

        // i am unable to get proxyquire, in tests, to require electron, so I have to hide it inside

        this.load();
    }

    load() {
        let values = this._electronSettings.getSync("values");
        if (values) {
            if (values.host) {
                this.host = values.host;
            }

            if (values.password) {
                this.password = values.password;
            }

            if (values.playPauseKey) {
                this.playPauseKey = values.playPauseKey;
            }
        }
    }

    save() {
        return this._electronSettings.setSync("values", {
            host: this.host,
            password: this.password,
            playPauseKey: this.playPauseKey
        });
    }
}

var settingsInstance = null;

function getSettings() {
    if (!settingsInstance) {
        settingsInstance = new Settings();
    }

    return settingsInstance;
}

// note: i am not just returning a new instance because due to electron requiring issues in proxyquire in tests
export default getSettings;