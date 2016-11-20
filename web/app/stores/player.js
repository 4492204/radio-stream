import loggerCreator from '../utils/logger'
//noinspection JSUnresolvedVariable
var moduleLogger = loggerCreator(__filename);

import { observable, action, computed } from "mobx";
import retries from "../utils/retries"

import assert from "../utils/assert"
import * as config from "../utils/constants"

class Player {
    @observable isPlaying = false;
    @observable currentPlaylist = null;
    @observable song = null;

    @observable loadingAction = null;
    @observable loadingError = null;

    constructor() {
    }

    _onPlayProgress(seconds) {
        if (this.song && this.song.isMarkedAsPlayed == false && seconds >= config.MARK_PLAYED_AFTER_SECONDS) {
            let logger = loggerCreator(this._onPlayProgress.name, moduleLogger);
            logger.info(`start`);

            return this.song.markAsPlayed();
        }
    }

    changePlaylist(playlist) {
        this.pause();
        this.currentPlaylist = playlist;
    }

    @action pause() {
        let promise = Promise.resolve();

        if (this.song) {
            promise = this.song.pauseSound();
        }

        this.isPlaying = false;

        return promise;
    }

    @action play() {
        assert(this.currentPlaylist, "invalid state");

        if (this.song) {
            this.song.playSound();
        } else {
            this.next()
        }

        this.isPlaying = true;
    }

    @action togglePlayPause() {
        let logger = loggerCreator(this.togglePlayPause.name, moduleLogger);
        logger.info(`start`);

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    _subscribeAndPlayNewSong(nextSong) {
        let logger = loggerCreator(this._subscribeAndPlayNewSong.name, moduleLogger);
        logger.info(`start: ${nextSong.toString()}`);

        if (this.song != nextSong || this.song == null) {
            this.song = nextSong;
            this.song.subscribePlayProgress(this._onPlayProgress.bind(this));
            this.song.subscribeFinish(this.next.bind(this));
        }

        this.loadingAction = `${nextSong.artist} - ${nextSong.title}: Loading sound...`;
        logger.info(`playing sound`);
        return this.song.playSound();
    }

    _preloadNextSong() {
        let logger = loggerCreator(this._preloadNextSong.name, moduleLogger);

        logger.info(`peeking next song`);
        return this.currentPlaylist.peekNextSong()
            .then((peekedSong) => {
                logger.info(`loading peeked song: ${peekedSong.toString()}`);
                return peekedSong.load();
            })
            .catch(err => {
                logger.warn(`failed to peek the next song: ${err.stack}`);
            })
    }

    @action next() {
        let logger = loggerCreator(this.next.name, moduleLogger);
        logger.info(`start`);

        // time since last player - toggle-pause.
        // if too long, stop and clear playlist

        let previousSong = this.song;
        this.song = null;

        assert(this.currentPlaylist, "invalid state");

        if (previousSong) {
            logger.info(`pausing playing song: ${previousSong}`);
            previousSong.pauseSound();
        }

        return Promise.resolve()
            .then(() => {
                if (previousSong) {
                    logger.info(`making sure song was marked as played`);
                    this.loadingAction = `${previousSong.artist} - ${previousSong.title}: Marking as played...`;
                    return previousSong.markAsPlayed()
                }
            }).then(() => retries.promiseRetry(lastError => {
                this.loadingAction = `Loading next song...`;
                this.loadingError = lastError && lastError.toString();
                return this.currentPlaylist.nextSong().then(this._subscribeAndPlayNewSong.bind(this))
            }))
            .then(this._preloadNextSong.bind(this))
    }

    @action stop() {
        return this.pause().then(() => {
            this.song = null;
        });
    }

    @computed get isLoading() {
        if (this.song && this.song.loadedSound) {
            return false;
        } else {
            return true;
        }
    }
}

export default new Player();