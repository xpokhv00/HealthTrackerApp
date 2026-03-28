import React, {useState} from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {colors} from '../theme/colors';

interface Props {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
}

const formatValue = (value: Date | null, mode: 'date' | 'time') => {
  if (!value) {
    return mode === 'date' ? 'Select date' : 'Select time';
  }

  if (mode === 'date') {
    return value.toLocaleDateString();
  }

  return value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DateTimeField: React.FC<Props> = ({label, mode, value, onChange}) => {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    onChange(selectedDate);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.field}
        activeOpacity={0.85}
        onPress={() => setShow(true)}>
        <Text style={styles.value}>{formatValue(value, mode)}</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
});

export default DateTimeField;
