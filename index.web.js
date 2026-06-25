import {AppRegistry} from 'react-native';
import App from './App';
import appConfig from './app.json';
const appName = appConfig.name;

const rootEl = document.getElementById('app-shell');

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  rootTag: rootEl,
  initialProps: {},
});
