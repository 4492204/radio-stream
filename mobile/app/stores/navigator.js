import loggerCreator from "app/utils/logger";
const moduleLogger = loggerCreator("navigator");

import { observable } from "mobx";

import constants from "app/utils/constants";

class Navigator {
  @observable activeRoute = null;

  constructor() {
    this.navigateToPlayer();
  }

  _navigateTo(address, params) {
    let logger = loggerCreator("_navigateTo", moduleLogger);
    logger.info(`${address}`);
    this.activeRoute = Object.assign({ address: address }, params);
  }

  navigateToPlayer() {
    loggerCreator("navigateToPlayer", moduleLogger);
    this._navigateTo(constants.ROUTE_PLAYER_PAGE);
  }

  navigateToSettings() {
    loggerCreator("navigateToSettings", moduleLogger);
    this._navigateTo(constants.ROUTE_SETTINGS_PAGE);
  }

  navigateToSearch(query, playlistName) {
    const logger = loggerCreator("navigateToSearch", moduleLogger);
    logger.info(`playlistName: ${playlistName} query: ${query}`);
    this._navigateTo(constants.ROUTE_SEARCH_PAGE, { playlistName, initialQuery: query });
  }
}

export const navigator = new Navigator();