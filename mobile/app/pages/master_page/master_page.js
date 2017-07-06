import loggerCreator from "app/utils/logger";
//noinspection JSUnresolvedVariable
const moduleLogger = loggerCreator("MasterPage");

import React, { Component } from "react";
import { Image, StyleSheet } from "react-native";
import { observer } from "mobx-react";

import { MenuContext } from "app/shared_components/context_menu/context_menu";
import Sidebar from "./sidebar";
import constants from "app/utils/constants";
import navigator from "app/stores/navigator/navigator";
import settings from "app/utils/settings/settings";
import settingsNative from "app/utils/settings/settings_native";

import PlaylistCollectionPage from "app/pages/playlist_collection_page";
import PlayerPage from "app/pages/player_page/player_page";
import SettingsPage from "app/pages/settings/settings_page";

import backgroundImage from "app/images/background.jpg";
import Topbar from "./topbar";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    // remove width and height to override fixed static size
    width: null,
    height: null,
    alignSelf: "stretch",
  },
  menuContext: { flex: 1, alignSelf: "stretch" },
});

@observer
export default class MasterPage extends Component {
  async componentWillMount() {
    let logger = loggerCreator("componentWillMount", moduleLogger);

    this.state = {
      ready: false,
    };

    logger.info(`loading settings`);
    await settings.load();
    await settingsNative.load();

    logger.info(`settings loaded`);
    this.setState({ ready: true });
  }

  render() {
    let logger = loggerCreator(this.render.name, moduleLogger);
    logger.info(`activate route: ${navigator.activeRoute}`);

    let page = null;
    let activeRoute = navigator.activeRoute;

    if (activeRoute) {
      switch (activeRoute.address) {
        case constants.ROUTE_PLAYLIST_COLLECTION_PAGE:
          page = <PlaylistCollectionPage />;
          break;
        case constants.ROUTE_PLAYER_PAGE:
          page = <PlayerPage playlistName={activeRoute.playlistName} />;
          break;
        case constants.ROUTE_SETTINGS_PAGE:
          page = <SettingsPage />;
          break;
        default:
          throw new Error("unexpected route");
      }
    }

    if (this.state.ready) {
      return (
        <Image source={backgroundImage} resizeMode="cover" style={styles.container}>
          <MenuContext customStyles={{ menuContextWrapper: styles.menuContext }}>
            <Topbar />
            {page}
          </MenuContext>
          <Sidebar />
        </Image>
      );
    } else {
      return null;
    }
  }
}

MasterPage.propTypes = {};