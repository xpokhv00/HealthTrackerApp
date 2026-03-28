import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';
import {handleNotificationActionEvent} from './src/services/notificationQuickActions';

notifee.onBackgroundEvent(async event => {
  await handleNotificationActionEvent(event);
});

AppRegistry.registerComponent(appName, () => App);
