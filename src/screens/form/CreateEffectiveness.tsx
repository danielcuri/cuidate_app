import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { formService } from '../../services/FormService';
import { loadingService } from '../../services/LoadingService';
import { alertService } from '../../services/AlertService';
import { queryService } from '../../services/QueryService';

type Route = RouteProp<RootStackParamList, 'CreateEffectiveness'>;

export function CreateEffectiveness() {
  const route = useRoute<Route>();
  const { pamolsaActionDetailId, effectiveDate } = route.params;
  const [effectiveFlag, setEffectiveFlag] = useState<'si' | 'no' | null>(null);
  const [comments, setComments] = useState('');
  const [date, setDate] = useState(() => {
    const d = effectiveDate ? new Date(effectiveDate) : new Date();
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });
  const [showPicker, setShowPicker] = useState(false);

  const minDate = new Date(new Date().getFullYear(), 0, 1);
  const maxDate = new Date(new Date().getFullYear() + 2, 11, 31);

  const viewOnly = false;

  const submit = async () => {
    if (effectiveFlag == null) {
      alertService.present('Eficacia', 'Indique si fue efectivo.');
      return;
    }
    await loadingService.present();
    try {
      const res = (await formService.saveEffectiveness({
        pamolsa_action_detail_id: pamolsaActionDetailId,
        effective_flag: effectiveFlag === 'si' ? 1 : 0,
        comments,
        effective_date: date.toISOString(),
      })) as { error?: boolean };
      if (res?.error) {
        queryService.manageErrors(res);
      } else {
        alertService.present('Eficacia', 'Registro guardado.');
      }
    } catch (e) {
      console.log(e);
      alertService.present('Error', 'No se pudo guardar.');
    } finally {
      await loadingService.dismiss();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.label}>¿Fue efectivo?</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, effectiveFlag === 'si' && styles.chipOn]}
          onPress={() => setEffectiveFlag('si')}
          disabled={viewOnly}
        >
          <Text style={[styles.chipTxt, effectiveFlag === 'si' && styles.chipTxtOn]}>
            Sí
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, effectiveFlag === 'no' && styles.chipOn]}
          onPress={() => setEffectiveFlag('no')}
          disabled={viewOnly}
        >
          <Text style={[styles.chipTxt, effectiveFlag === 'no' && styles.chipTxtOn]}>
            No
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Comentarios</Text>
      <TextInput
        style={styles.area}
        value={comments}
        onChangeText={setComments}
        editable={!viewOnly}
        multiline
        placeholder="Observaciones"
      />

      <Text style={styles.label}>Fecha eficacia</Text>
      <TouchableOpacity
        style={styles.field}
        onPress={() => !viewOnly && setShowPicker(true)}
        disabled={viewOnly}
      >
        <Text>{date.toLocaleString()}</Text>
      </TouchableOpacity>
      {showPicker && !viewOnly ? (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={(_, d) => {
            setShowPicker(false);
            if (d) {
              setDate(d);
            }
          }}
        />
      ) : null}

      {!viewOnly ? (
        <TouchableOpacity style={styles.primary} onPress={submit}>
          <Text style={styles.primaryTxt}>Enviar</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40, backgroundColor: COLORS.menuContentBg, flexGrow: 1 },
  label: { marginTop: 12, fontWeight: '700', color: COLORS.textLabel },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  chipOn: { backgroundColor: COLORS.primary },
  chipTxt: { color: COLORS.text },
  chipTxtOn: { color: COLORS.white, fontWeight: '800' },
  area: {
    marginTop: 6,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    textAlignVertical: 'top',
  },
  field: {
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  primary: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryTxt: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
