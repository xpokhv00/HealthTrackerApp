import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, RootTabParamList} from './types';
import {navigationTheme} from './navigationTheme';

import HomeScreen from '../screens/HomeScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import SymptomsScreen from '../screens/SymptomsScreen';
import HistoryScreen from '../screens/HistoryScreen';

import AddMedicationScreen from '../screens/AddMedicationScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import AddAppointmentScreen from '../screens/AddAppointmentScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import AddSymptomScreen from '../screens/AddSymptomScreen';
import SymptomDetailScreen from '../screens/SymptomDetailScreen';
import DoctorReportScreen from '../screens/DoctorReportScreen';

import {navigationRef} from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const getTabIconName = (
  routeName: keyof RootTabParamList,
  focused: boolean,
): string => {
  switch (routeName) {
    case 'Home':
      return focused ? 'home' : 'home-outline';
    case 'Medications':
      return focused ? 'medkit' : 'medkit-outline';
    case 'Appointments':
      return focused ? 'calendar' : 'calendar-outline';
    case 'Symptoms':
      return focused ? 'heart' : 'heart-outline';
    case 'History':
      return focused ? 'document-text' : 'document-text-outline';
    default:
      return focused ? 'ellipse' : 'ellipse-outline';
  }
};

const Tabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4F7CFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({focused, color, size}) => (
          <Ionicons
            name={getTabIconName(route.name, focused)}
            size={size ?? 22}
            color={color}
          />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Medications" component={MedicationsScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Symptoms" component={SymptomsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddMedication"
          component={AddMedicationScreen}
          options={({route}: any) => ({
            title: route.params?.medicationId
              ? 'Edit Medication'
              : 'Add Medication',
          })}
        />
        <Stack.Screen
          name="MedicationDetail"
          component={MedicationDetailScreen}
          options={{title: 'Medication Detail'}}
        />
        <Stack.Screen
          name="AddAppointment"
          component={AddAppointmentScreen}
          options={({route}: any) => ({
            title: route.params?.appointmentId
              ? 'Edit Appointment'
              : 'Add Appointment',
          })}
        />
        <Stack.Screen
          name="AppointmentDetail"
          component={AppointmentDetailScreen}
          options={{title: 'Appointment Detail'}}
        />
        <Stack.Screen
          name="AddSymptom"
          component={AddSymptomScreen}
          options={({route}: any) => ({
            title: route.params?.symptomId ? 'Edit Symptom' : 'Log Symptom',
          })}
        />
        <Stack.Screen
          name="SymptomDetail"
          component={SymptomDetailScreen}
          options={{title: 'Symptom Detail'}}
        />
        <Stack.Screen
          name="DoctorReport"
          component={DoctorReportScreen}
          options={{title: 'Doctor Report'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
