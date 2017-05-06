import loggerCreator from '../utils/logger'
//noinspection JSUnresolvedVariable
var moduleLogger = loggerCreator("player");

import {observable, action, computed} from "mobx";
import retries from "../utils/retries"
import assert from "../utils/assert"
import Playlist from './web/playlist'
import * as wrappedSoundManager from './web/wrapped_sound_manager'

class Player {

  MARK_PLAYED_AFTER_SECONDS = 20;

  @observable isPlaying = false;
  @observable currentPlaylist = null;
  @observable song = null;

  @observable loadingAction = null;
  @observable loadingError = null;

  constructor() {
    let logger = loggerCreator("constructor", moduleLogger);
    logger.info(`start`);

    logger.info(`initializing soundmanager2`);
    wrappedSoundManager.setup();
  }

  _onPlayProgress(seconds) {
    if (this.song && this.song.markingAsPlayedPromise === null && seconds >= this.MARK_PLAYED_AFTER_SECONDS) {
      let logger = loggerCreator(this._onPlayProgress.name, moduleLogger);
      logger.info(`start`);

      return this.song.markAsPlayed();
    }
  }

  async changePlaylist(playlistName) {
    let logger = loggerCreator("changePlaylist", moduleLogger);
    logger.info(`start`);

    await this.stop();

    logger.info(`setting playlist to ${playlistName}`);
    this.currentPlaylist = new Playlist(playlistName);
  }

  @action pause() {
    let logger = loggerCreator("pause", moduleLogger);
    logger.info(`start`);

    let promise = Promise.resolve();

    if (this.song) {
      promise = this.song.pauseSound();
    }

    this.isPlaying = false;

    return promise;
  }

  @action play() {
    let logger = loggerCreator("play", moduleLogger);
    logger.info(`start`);

    assert(this.currentPlaylist, "unexpected: playlist isn't set");

    if (this.song) {
      this.song.playSound();
    } else {
      this.next()
    }

    this.isPlaying = true;
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

  async next() {
    let logger = loggerCreator(this.next.name, moduleLogger);
    logger.info(`start`);

    // time since last player - toggle-pause.
    // if too long, stop and clear playlist

    let previousSong = this.song;
    this.song = null;

    assert(this.currentPlaylist, "invalid state");

    if (previousSong) {
      logger.info(`previous song: ${previousSong.toString()}`);

      logger.info(`previous song - pausing playing song`);
      previousSong.pauseSound();

      logger.info(`previous song - making sure was marked as played`);
      if (previousSong.markingAsPlayedPromise) {
        logger.info(`previous song - marking as played`);
        await previousSong.markAsPlayed();
      } else {
        logger.info(`previous song - no need to mark as played`);
      }
    }

    await retries.promiseRetry(async lastError => {
      this.loadingAction = `Loading next song...`;
      this.loadingError = lastError && lastError.toString();
      let nextSong = await this.currentPlaylist.nextSong();

      if(nextSong !== null) {
        logger.info(`got next song: ${nextSong.toString()}`);

        if (this.song !== nextSong || this.song === null) {
          this.song = nextSong;
          logger.info(`subscribing to song events`);
          this.song.subscribePlayProgress(this._onPlayProgress.bind(this));
          this.song.subscribeFinish(this.next.bind(this));
        }

        this.loadingAction = `${nextSong.artist} - ${nextSong.title}`;
        logger.info(`playing sound`);
        await this.song.playSound();
      } else {
        logger.info(`no next song returned - playlist is empty`);
        this.loadingError = "Playlist is empty - No additional songs found"
      }
    })

    await this._preloadNextSong();
  }

  @action stop() {
    let logger = loggerCreator("stop", moduleLogger);
    logger.info(`start`);

    return this.pause().then(() => {
      logger.info(`setting song to null`);
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