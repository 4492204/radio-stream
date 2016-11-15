import loggerCreator from '../utils/logger'
var moduleLogger = loggerCreator("playlist_collection_page");

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Image,
  ProgressBar,
  ActivityIndicator
} from 'react-native';

import { colors } from '../styles/styles'
import Button from '../components/button'

import metadataBackendProxy from '../native_proxy/metadata_backend_proxy'

export default class PlaylistCollectionPage extends Component {
  _fetchPlaylists() {
    let logger = loggerCreator(this._fetchPlaylists.name, moduleLogger);
    logger.info("start");

    metadataBackendProxy.fetchPlaylists().then(result => {
      logger.info(`got results: ${result}`);
      this.setState({playlists: result})
    })

  }

  componentWillMount() {
    this.state = {};
    this._fetchPlaylists();
  }

  render() {
    let logger = loggerCreator(this.render.name, moduleLogger);
    logger.info(`start`);

    return (
      <View style={styles.container}>
        <Image source={require("../images/logo.png")}
               style={styles.logo}/>

        <Choose>
          <When condition={this.state.playlists}>
            {
              this.state.playlists.map(playlist => {
                return (
                  <Button key={playlist} style={styles.playlistButton}
                          className="playlist"
                          onPress={() => logger.info(`clicked playlist: ${playlist}`)}>
                    <Text style={styles.text}>{playlist}</Text>
                  </Button>)
              })
            }
          </When>
          <Otherwise>
            <ActivityIndicator />
          </Otherwise>
        </Choose>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center"
  },
  logo: {
    width: 90,
    height: 90,
    marginVertical: 20,
    resizeMode: "contain"
  },
  playlistButton: {
    width: 150,
    marginBottom: 10,
  },
  text: {
    color: colors.SEMI_WHITE.rgbString()
  }
});