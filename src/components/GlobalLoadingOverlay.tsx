import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Modal, StyleSheet, View } from 'react-native';
import { GLOBAL_LOADING_EVENT } from '../services/LoadingService';

export function GlobalLoadingOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(GLOBAL_LOADING_EVENT, (v: boolean) => {
      setVisible(v);
    });
    return () => sub.remove();
  }, []);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
