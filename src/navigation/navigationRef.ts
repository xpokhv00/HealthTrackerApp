import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigateFromNotification = (
  screen: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList],
) => {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.navigate(screen as never, params as never);
};
