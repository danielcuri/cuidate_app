import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { deleteDraft } from '../../utils/formDrafts';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { FormLocalSaved } from '../../interfaces/forms';
import { FormListCard } from '../../components/form/FormListCard';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Nav = StackNavigationProp<RootStackParamList, 'ListPending'>;

export function ListPending() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<FormLocalSaved[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const reload = useCallback(async () => {
    await formService.loadStorage();
    setItems([...(formService.forms_saved_local as FormLocalSaved[])]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const removeAt = (index: number) => {
    Alert.alert('Eliminar borrador', '¿Desea eliminar este borrador?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteDraft(index);
          await reload();
        },
      },
    ]);
  };

  const editAt = (item: FormLocalSaved, index: number) => {
    navigation.navigate('CanvasFormEdit', {
      formId: item.form_id,
      index,
    });
  };

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <RecordsHeader title="Pendientes" onBack={() => navigation.navigate('FormMenu')} />
      </SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(_, i) => `d-${i}`}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay borradores guardados en este dispositivo.</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.rowWrap}>
            <FormListCard
              title={item.name || `Borrador #${index + 1}`}
              meta={item.created}
              onPress={() => editAt(item, index)}
            />
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => editAt(item, index)}
                accessibilityLabel="Editar"
              >
                <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => removeAt(index)}
                accessibilityLabel="Eliminar"
              >
                <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  safeTop: { backgroundColor: COLORS.white },
  empty: { textAlign: 'center', marginTop: 48, color: COLORS.textMuted, paddingHorizontal: 24 },
  rowWrap: { position: 'relative' },
  actions: {
    position: 'absolute',
    right: 20,
    top: 24,
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: { padding: 8 },
});
