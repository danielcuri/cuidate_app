import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList>;

type Props = {
  visible: boolean;
  mode: 'create' | 'view';
  /** Fecha propuesta de la acción (desde detalle). */
  proposedDate?: string;
  onClose: () => void;
  onSave?: (payload: {
    execution_date: string;
    status: number;
    comments: string;
  }) => void;
  navigation: Nav;
};

const STATUS_OPTS = [
  { id: 0, name: 'Pendiente' },
  { id: 1, name: 'En proceso' },
  { id: 2, name: 'Ejecutado' },
  { id: 3, name: 'No aplica' },
];

/** Paridad TracingPage: crear / visualizar seguimiento. */
export function TracingBottomSheet({
  visible,
  mode,
  proposedDate,
  onClose,
  onSave,
  navigation,
}: Props) {
  const [execution, setExecution] = useState(new Date());
  const [status, setStatus] = useState(0);
  const [comments, setComments] = useState('');
  const [showDate, setShowDate] = useState(false);

  const readonly = mode === 'view';

  const submit = () => {
    if (readonly || !onSave) {
      onClose();
      return;
    }
    onSave({
      execution_date: execution.toISOString(),
      status,
      comments,
    });
    if (status === 2) {
      navigation.navigate('Effectiveness');
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {readonly ? 'Ver seguimiento' : 'Nuevo seguimiento'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.link}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {proposedDate ? (
            <Text style={styles.hint}>Fecha propuesta acción: {proposedDate}</Text>
          ) : null}
          <Text style={styles.label}>Fecha ejecución</Text>
          <TouchableOpacity
            style={styles.field}
            disabled={readonly}
            onPress={() => !readonly && setShowDate(true)}
          >
            <Text>{execution.toLocaleString()}</Text>
          </TouchableOpacity>
          {showDate && !readonly ? (
            <DateTimePicker
              value={execution}
              mode="datetime"
              display="default"
              onChange={(_, d) => {
                setShowDate(false);
                if (d) {
                  setExecution(d);
                }
              }}
            />
          ) : null}

          <Text style={styles.label}>Estado</Text>
          <View style={styles.row}>
            {STATUS_OPTS.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.chip, status === o.id && styles.chipOn]}
                disabled={readonly}
                onPress={() => setStatus(o.id)}
              >
                <Text style={[styles.chipTxt, status === o.id && styles.chipTxtOn]}>
                  {o.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.area}
            value={comments}
            onChangeText={setComments}
            editable={!readonly}
            multiline
            placeholder="Comentarios"
          />

          {!readonly ? (
            <TouchableOpacity style={styles.primary} onPress={submit}>
              <Text style={styles.primaryTxt}>Guardar</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  link: { color: COLORS.primary, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40 },
  hint: { marginBottom: 12, color: COLORS.textMuted },
  label: { marginTop: 12, fontWeight: '700', color: COLORS.textLabel },
  field: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  chipOn: { backgroundColor: COLORS.primary },
  chipTxt: { fontSize: 12, color: COLORS.text },
  chipTxtOn: { color: COLORS.white, fontWeight: '700' },
  area: {
    marginTop: 6,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  primary: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryTxt: { color: COLORS.white, fontWeight: '800' },
});
