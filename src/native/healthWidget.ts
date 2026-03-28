import {NativeModules, Platform} from 'react-native';

const {HealthWidgetModule} = NativeModules;

type WidgetMedicationData = {
  name: string;
  dosage: string;
  nextTime: string;
};

export const updateMedicationWidget = async (data: WidgetMedicationData) => {
  if (Platform.OS !== 'android' || !HealthWidgetModule) {
    return;
  }

  await HealthWidgetModule.updateMedicationWidget(data);
};

export const clearMedicationWidget = async () => {
  if (Platform.OS !== 'android' || !HealthWidgetModule) {
    return;
  }

  await HealthWidgetModule.clearMedicationWidget();
};
