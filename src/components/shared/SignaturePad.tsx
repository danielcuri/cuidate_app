import React from 'react';
import { View, StyleSheet } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';

type Props = {
  onOK?: (signature: string) => void;
};

/** Parity: `angular2-signaturepad` — wire `onOK` when implementing flows. */
export function SignaturePad({ onOK }: Props) {
  return (
    <View style={styles.wrap}>
      <SignatureCanvas
        webStyle={`.m-signature-pad { box-shadow: none; border: none; }`}
        onOK={onOK ?? (() => {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 200 },
});
