import {Medication} from '../types/medication';
import {clearMedicationWidget, updateMedicationWidget} from '../native/healthWidget';
import {getMedicationForWidget} from '../utils/widgetMedication';

export const syncMedicationWidget = async (medications: Medication[]) => {
  const widgetMedication = getMedicationForWidget(medications);

  if (!widgetMedication) {
    await clearMedicationWidget();
    return;
  }

  await updateMedicationWidget(widgetMedication);
};
