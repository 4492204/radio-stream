import loggerCreator from "app/utils/logger";
//noinspection JSUnresolvedVariable
var moduleLogger = loggerCreator("AlbumArt");

import React, { Component } from "react";
import { Image, StyleSheet, View, Dimensions } from "react-native";
import { observer } from "mobx-react";

import FlipCard from "app/utils/flip_card";
import NormalText from "app/shared_components/text/normal_text";
import moment from "moment";
import { colors, fontSizes } from "app/styles/styles";
import DimensionsChangedEmitter from "app/utils/dimensions_changed_emitter/dimensions_changed_emitter";
import { dimensionsStore } from "app/stores/dimensions_store";

let artSize = 260;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    borderColor: colors.CYAN_DARK,
    borderWidth: 2,

    position: "relative",
    alignSelf: "center",
  },
  albumArt: {
    resizeMode: "cover",

    width: artSize,
    height: artSize,
  },
  flippedAlbumArt: {
    padding: 10,
  },
  additionalSongInfo: {
    marginBottom: 5,
  },
});

@observer
export default class AlbumArt extends Component {
  _containerRef = null;
  _dimensionsChangedEmitter = new DimensionsChangedEmitter();

  componentWillMount() {
    let logger = loggerCreator("componentWillMount", moduleLogger);
    this.state = {
      artSize: 260,
    };

    this._dimensionsChangedEmitter.subscribe(this._onDimensionsChanged);
  }

  componentWillUnmount() {
    this._dimensionsChangedEmitter.unsubscribe();
  }

  _onContainerHeightChanged(newHeight) {
    const logger = loggerCreator("_onContainerHeightChanged", moduleLogger);

    logger.log(`New height: ${newHeight}. Window width: ${dimensionsStore.width}`);
    const newArtSize = Math.min(dimensionsStore.width - 20, newHeight - 5);
    this.setState({ artSize: newArtSize });
  }

  _onDimensionsChanged = () => {
    const logger = loggerCreator("_onDimensionsChanged", moduleLogger);
    if (this._containerRef) {
      logger.info(`measuring...`);
      this._containerRef.measure((a, b, width, height, px, py) => {
        this._onContainerHeightChanged(height);
      });
    }
  };

  _onContainerLayout = event => {
    loggerCreator("_onContainerLayout", moduleLogger);
    let { height } = event.nativeEvent.layout;

    this._onContainerHeightChanged(height);
  };

  _onContainerRef = ref => {
    this._containerRef = ref;
  };

  render() {
    let logger = loggerCreator("render", moduleLogger);
    logger.info(`start`);

    const song = this.props.song;

    let albumArt = require("app/images/no-album.png");
    if (song.loadedImageUrl) {
      logger.info(`uri: ${song.loadedImageUrl}`);
      albumArt = { uri: song.loadedImageUrl };
    }

    return (
      <View style={this.props.style} onLayout={this._onContainerLayout} ref={this._onContainerRef}>
        <FlipCard style={styles.container} flipHorizontal={true} flipVertical={false}>
          <View>
            <Image
              style={[styles.albumArt, { width: this.state.artSize, height: this.state.artSize }]}
              source={albumArt}
            />
          </View>
          <View style={[styles.flippedAlbumArt, { width: this.state.artSize, height: this.state.artSize }]}>
            <NormalText style={styles.additionalSongInfo}>
              Last played: {moment.unix(song.lastplayed).fromNow()}
            </NormalText>
            <NormalText style={styles.additionalSongInfo}>
              Play count: {song.playcount}
            </NormalText>
            <NormalText style={styles.additionalSongInfo}>
              Marked as played: {song.isMarkedAsPlayed ? "✔" : "x"}
            </NormalText>
          </View>
        </FlipCard>
      </View>
    );
  }
}

AlbumArt.propTypes = {
  song: React.PropTypes.object.isRequired,
};