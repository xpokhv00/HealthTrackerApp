import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import {colors} from '../theme/colors';

interface Props {
  children: React.ReactNode;
}

const Screen: React.FC<Props> = ({children}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});

export default Screen;
