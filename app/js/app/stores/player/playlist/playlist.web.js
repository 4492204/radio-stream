import loggerCreator from "app/utils/logger";
const moduleLogger = loggerCreator("playlist.web");

import { computed, observable } from "mobx";

import Song from "app/stores/player/song/song.web";
import { backendMetadataApiGetter } from "app/utils/backend_metadata_api/backend_metadata_api_getter";
import constants from "app/utils/constants";

export default class Playlist {
  @observable name = null;
  @observable songs = [];
  @observable _currentIndex = -1;

  _onPlayProgressCallback = null;
  _onFinishCallback = null;

  @computed
  get currentIndex() {
    return this._currentIndex;
  }

  @computed
  get currentSong() {
    const logger = loggerCreator("currentSong", moduleLogger);
    logger.info(`current index: ${this.currentIndex}`);
    if (this._currentIndex >= 0 && this.songs.length > 0) {
      return this.songs[this.currentIndex];
    } else {
      return null;
    }
  }

  _lastReloadDate = null;

  constructor(name) {
    this.name = name;
  }

  _areSongsOutOfDate() {
    let logger = loggerCreator(this._areSongsOutOfDate.name, moduleLogger);

    let result = null;
    if (!this._lastReloadDate) {
      logger.info(`no reload date found`);
      result = true;
    } else {
      let secondsSinceReload = new Date() - this._lastReloadDate;
      logger.info(`seconds since reload ${secondsSinceReload}`);
      let minutesSinceReload = secondsSinceReload / 1000 / 60;
      logger.info(
        `is minutes since reload ${minutesSinceReload} more than ${constants.RELOAD_PLAYLIST_AFTER_MINUTES}?`
      );

      result = minutesSinceReload >= constants.RELOAD_PLAYLIST_AFTER_MINUTES;
    }

    logger.info(`returning: ${result}`);
    return result;
  }

  async _addSongsIfCurrentIsLast() {
    let logger = loggerCreator(this._addSongsIfCurrentIsLast.name, moduleLogger);

    if (this._areSongsOutOfDate()) {
      logger.info(
        `remaining of the list is out of date, removing all the songs after song index: ${this._currentIndex}`
      );
      this.songs = this.songs.slice(0, this._currentIndex + 1);
    }

    logger.info(`songs length: ${this.songs.length}. Current index: ${this._currentIndex}`);
    var isEnoughSongsInList = this.songs.length > 0 && this._currentIndex + 1 < this.songs.length;
    logger.info(`enough songs in list? ${isEnoughSongsInList}`);

    if (isEnoughSongsInList) {
      // playlist songs already loaded
      logger.info(`not reloading songs`);
      return Promise.resolve();
    } else {
      logger.info(`reloading songs`);

      let songsData = await backendMetadataApiGetter.get().playlistSongs(this.name);
      logger.info(`fetched songs: ${songsData.length}`);
      // the backend might return songs that are already in the playlist, e.g, if we skipped them before marking them
      // as played. in this case we must filter them out to prevent duplicates in the playlist
      songsData = songsData.filter(songData => !this.songs.find(song => song.id === songData.id));
      logger.info(`remaining songs after filtering out existing ones in playlist: ${songsData.length}`);

      this.songs = [
        ...this.songs,
        ...songsData.map(songData => new Song(songData, this._onPlayProgressCallback, this._onFinishCallback)),
      ];
      logger.info(`loaded songs: ${songsData.length}`);

      this._lastReloadDate = new Date();
    }
  }

  subscribePlayProgress(callback) {
    this._onPlayProgressCallback = callback;
  }

  subscribeFinish(callback) {
    this._onFinishCallback = callback;
  }

  async nextSong() {
    let logger = loggerCreator(this.nextSong.name, moduleLogger);

    return this.peekNextSong().then(song => {
      this._currentIndex++;
      logger.info(`new index: ${this._currentIndex}`);

      return song;
    });
  }

  async peekNextSong() {
    let logger = loggerCreator(this.peekNextSong.name, moduleLogger);

    await this._addSongsIfCurrentIsLast();

    let nextIndex = this._currentIndex + 1;
    logger.info(`returning song by index: ${nextIndex}`);

    let song = this.songs[nextIndex];
    logger.info(`returning song: ${song}`);

    return song;
  }

  skipToSongByIndex(index) {
    const logger = loggerCreator("skipToSongByIndex", moduleLogger);

    logger.info(`changing song to index: ${index} out of total ${this.songs.length} songs`);

    if (index >= this.songs.length) {
      throw new Error(`requested index is out of bounds: ${index} >= ${this.songs.length}`);
    }

    this._currentIndex = index;
    return this.songs[this._currentIndex];
  }
}
