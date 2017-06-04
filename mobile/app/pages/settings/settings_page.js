import loggerCreator from "../../utils/logger";
const moduleLogger = loggerCreator("settings_page");

import React, { Component } from "react";
import { StyleSheet, View, TextInput } from "react-native";
import BackHandler from "../../utils/back_handler/back_handler";
import mobx from "mobx";
import { observer } from "mobx-react";

import Button from "../../shared_components/rectangle_button";
import NormalText from "../../shared_components/text/normal_text";
import ButtonText from "../../shared_components/text/button_text";
import SettingsPageNative from "./settings_page_native";
import settings from "../../utils/settings/settings";
import settingsNative from "../../utils/settings/settings_native";
import backendMetadataApi from "../../utils/backend_metadata_api";
import navigator from "../../stores/navigator/navigator";
import SettingsTextInput from "./settings_text_input";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // remove width and height to override fixed static size
    width: 250,
    height: null,
    alignSelf: "center",

    marginVertical: 20,
  },
  submit: {
    alignSelf: "flex-start",
    marginTop: 20,
  },

  saveButton: {
    marginTop: 10,
  },
});

@observer
export default class SettingsPage extends Component {
  constructor(props) {
    super(props);

    let logger = loggerCreator("constructor", moduleLogger);

    this.settingsValues = mobx.observable({
      host: settings.host,
      password: settings.password,

      status: null,
    });

    this.settingsValuesNative = mobx.asMap();

    BackHandler.addEventListener("hardwareBackPress", () => this.onPressHardwareBack());
  }

  onPressHardwareBack() {
    let logger = loggerCreator("onPressHardwareBack", moduleLogger);

    if (settings.host) {
      logger.info(`cancelling setting changes`);
      navigator.navigateToPlaylistCollection();
    } else {
      logger.info(`no host was configured - quitting`);
      BackHandler.exitApp();
    }

    return true;
  }

  onTextChange(label, text) {
    let logger = loggerCreator("onTextChange", moduleLogger);
    logger.info(`changing ${label}`);

    this.settingsValues[label] = text;
  }

  onPlatformSettingsChanged = newPlatformSettings => {
    this.platformSettings = newPlatformSettings;
  };

  async onSavePress() {
    let logger = loggerCreator("onSavePress", moduleLogger);

    let host = this.settingsValues.host;
    let password = this.settingsValues.password;

    try {
      this.settingsValues.status = "Connecting...";
      await backendMetadataApi.testConnection(host, password);
      this.settingsValues.status = "Connected";

      logger.info(`updating global settings`);

      settings.host = host;
      settings.password = password;
      await settings.save();
      await settingsNative.save(this.settingsValuesNative.toJS());

      navigator.navigateToPlaylistCollection();
    } catch (error) {
      this.settingsValues.status = `Failed: ${error}`;
    }
  }

  render() {
    let logger = loggerCreator(this.render.name, moduleLogger);

    return (
      <View style={styles.container}>
        <SettingsTextInput
          label="Host"
          value={this.settingsValues.host}
          onChangeText={text => this.onTextChange("host", text)}
        />
        <SettingsTextInput
          label="Password"
          value={this.settingsValues.password}
          textInputProps={{ secureTextEntry: true }}
          onChangeText={text => this.onTextChange("password", text)}
        />

        <SettingsPageNative settingsValuesNative={this.settingsValuesNative} />

        <Button style={[styles.saveButton]} onPress={() => this.onSavePress()}>
          <ButtonText>Save</ButtonText>
        </Button>
        <NormalText style={[styles.status]}>{this.settingsValues.status}</NormalText>
      </View>
    );
  }
}