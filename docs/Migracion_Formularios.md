# Migración: Flujo Formularios (Application Form)

---

**Origen:** `E:\ionic_projects\pamolsa-app`

## 1. Árbol de pantallas (Ionic)

```
/form-menu               → pages/application-form/menu/           (MenuPage)
  │
  ├── /form-formats       → pages/application-form/formats/        (FormatsPage)
  │     └── /canvas-form  { form_id }                              (CanvasFormPage) ← form dinámico
  │           ├── modal: TableDetailPage       ← filas de tablas dentro del formulario
  │           │     └── modal: EditPhotoPage   ← edición de foto sobre canvas
  │           └── modal: EditPhotoPage         ← edición directa de foto en campo
  │
  ├── /form-records       → pages/application-form/records/        (RecordsPage)
  │     └── /canvas-form  { form_data_index, form_id }             (CanvasFormPage) ← igual que arriba
  │
  ├── /form-list-pending  → pages/application-form/list-pending/   (ListPendingPage)
  │     └── /canvas-form-edit { form_id, index }                   (CanvasFormEditPage)
  │           ├── modal: TableDetailPage
  │           │     └── modal: EditPhotoPage
  │           └── modal: EditPhotoPage
  │
  ├── /form-list-pamolsa  → pages/application-form/list-pamolsa/   (ListPamolsaPage) [showPamolsa]
  │     └── /canvas-form  { form_data_index, form_id }             (CanvasFormPage)
  │
  ├── /form-actions       → pages/application-form/actions/        (ActionsPage)     [showPamolsa]
  │     ├── modal: FilterFormPage                                  ← filtros con selects encadenados
  │     │     └── modal: VirtualSelectComponent                    ← buscador de usuarios
  │     └── /action-detail { action_id }                           (ActionDetailPage)
  │           └── modal: TracingPage                               ← crear/ver seguimiento
  │                 └── modal: EditPhotoPage                       ← editar foto del seguimiento
  │
  └── /form-effectiveness → pages/application-form/effectiveness/  (EffectivenessPage) [showPamolsa]
        ├── modal: FilterFormPage
        │     └── modal: VirtualSelectComponent
        └── /create-effectiveness { pamolsa_action_detail_id, effective_date }
              └── modal: EditPhotoPage                             ← editar foto de eficacia
```

**Páginas / Componentes implicados en este flujo:**

| Archivo Ionic                           | Rol                                              |
| --------------------------------------- | ------------------------------------------------ |
| `pages/application-form/menu/`          | Menú principal del flujo                         |
| `pages/application-form/formats/`       | Lista de formatos disponibles                    |
| `pages/application-form/records/`       | Registros enviados (paginado)                    |
| `pages/application-form/list-pending/`  | Guardados locales sin enviar                     |
| `pages/application-form/list-pamolsa/`  | Inspecciones SST (condicional)                   |
| `pages/application-form/actions/`       | Seguimiento de acciones propuestas               |
| `pages/application-form/effectiveness/` | Eficacia de acciones ejecutadas                  |
| `pages/application-form/filter-form/`   | Modal de filtros (Planta, Área, Estado, Fuente)  |
| `pages/canvas-form/`                    | Formulario dinámico (nuevo registro)             |
| `pages/canvas-form-edit/`               | Formulario dinámico (edición de borrador local)  |
| `pages/table-detail/`                   | Modal para gestionar filas de tablas en el form  |
| `pages/edit-photo/`                     | Modal para editar foto sobre canvas              |
| `pages/action-detail/`                  | Detalle de acción propuesta + lista de trazas    |
| `pages/tracing/`                        | Modal para crear/ver seguimiento de una acción   |
| `pages/create-effectiveness/`           | Formulario de eficacia de acción ejecutada       |
| `components/virtual-select/`            | Buscador con scroll virtual para selección users |

---

## 2. Árbol de pantallas propuesto (React Native Expo)

```
FormMenuScreen
  │
  ├── FormFormatsScreen
  │     └── CanvasFormScreen  { formId }
  │           ├── TableDetailBottomSheet   ← @gorhom/bottom-sheet
  │           │     └── EditPhotoModal
  │           └── EditPhotoModal
  │
  ├── FormRecordsScreen
  │     └── CanvasFormScreen  { formDataIndex, formId }
  │
  ├── FormPendingScreen
  │     └── CanvasFormEditScreen  { formId, index }
  │           ├── TableDetailBottomSheet
  │           └── EditPhotoModal
  │
  ├── FormPamolsaScreen                          [condicional: showPamolsa]
  │     └── CanvasFormScreen  { formDataIndex, formId }
  │
  ├── FormActionsScreen                          [condicional: showPamolsa]
  │     ├── FilterBottomSheet
  │     │     └── UserSearchModal
  │     └── ActionDetailScreen  { actionId }
  │           └── TracingBottomSheet  { pamolsaActionDetailId, proposedDate, tracingIndex? }
  │                 └── EditPhotoModal
  │
  └── FormEffectivenessScreen                    [condicional: showPamolsa]
        ├── FilterBottomSheet
        │     └── UserSearchModal
        └── CreateEffectivenessScreen  { pamolsaActionDetailId, effectiveDate }
              └── EditPhotoModal
```

---

## 3. Tabla de equivalencias de componentes

| Ionic                              | React Native Expo                               | Notas                                                     |
| ---------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| `ion-header` / `ion-toolbar`       | Custom `Header` component                       | Logos + barra tricolor rojo/amarillo/verde                |
| `ion-content`                      | `ScrollView` o `FlatList`                       |                                                           |
| `ion-refresher`                    | `RefreshControl`                                |                                                           |
| `ion-infinite-scroll`              | `FlatList` con `onEndReached`                   |                                                           |
| `ion-grid / ion-row / ion-col`     | `View` con `flex`                               |                                                           |
| `app-card` (componente propio)     | `CardComponent` reutilizable                    | Props: title, date, status, approved, cardFormat, etc.    |
| `ion-back-button`                  | `navigation.goBack()`                           |                                                           |
| `ion-button`                       | `TouchableOpacity` / `Pressable`                |                                                           |
| `ion-footer`                       | `View` fijo + `SafeAreaView`                    |                                                           |
| `ion-icon`                         | `@expo/vector-icons` Ionicons                   |                                                           |
| `ion-slides` / `IonSlides`         | `ScrollView` horizontal paginado                | Usado en `CanvasForm` y `TableDetail` para secciones      |
| `ion-select` / `ion-select-option` | Modal custom con lista o `Picker`               |                                                           |
| `ion-datetime`                     | `@react-native-community/datetimepicker`        | Ya en package.json                                        |
| `ion-radio-group` / `ion-radio`    | Custom `RadioGroup` component                   |                                                           |
| `ion-checkbox`                     | Custom `Checkbox` component                     |                                                           |
| `ion-textarea`                     | `TextInput multiline`                           |                                                           |
| `ion-range`                        | `@react-native-community/slider`                | Ya en package.json                                        |
| `ion-infinite-scroll-content`      | `ActivityIndicator` como `ListFooterComponent`  |                                                           |
| `ModalController` (modales)        | `@gorhom/bottom-sheet` o `Modal` RN             | TableDetail, Tracing, EditPhoto → BottomSheet o Modal     |
| `AlertController`                  | `Alert.alert(...)`                              |                                                           |
| `ActionSheetController`            | `Alert.alert` con múltiples botones             | Para opciones de foto                                     |
| `Camera` (Ionic Native)            | `expo-image-picker` + `expo-camera`             | Ya en package.json                                        |
| `LocationService`                  | `expo-location`                                 | Ya en package.json — campos de geolocalización en el form |
| `IonSlides` (canvas steps)         | `ScrollView` paginado horizontal                | Para navegación entre secciones del formulario            |
| `canvas` (HTML5)                   | `react-native-signature-canvas`                 | Ya en package.json — campos de firma en el form           |
| `Events` (Ionic pub/sub)           | `useFocusEffect` o Zustand store reactivo       |                                                           |
| `VirtualSelectComponent`           | `FlatList` con `TextInput` de búsqueda en Modal | Lista virtualizada de usuarios                            |

---

## 4. Navegación

**Ionic:** rutas planas globales con matrix params.

**React Native Expo (React Navigation v6+):**

```typescript
const FormStack = createStackNavigator();

export function FormNavigator() {
  return (
    <FormStack.Navigator>
      <FormStack.Screen name="FormMenu"             component={FormMenuScreen} />
      <FormStack.Screen name="FormFormats"          component={FormFormatsScreen} />
      <FormStack.Screen name="FormRecords"          component={FormRecordsScreen} />
      <FormStack.Screen name="FormPending"          component={FormPendingScreen} />
      <FormStack.Screen name="FormPamolsa"          component={FormPamolsaScreen} />
      <FormStack.Screen name="FormActions"          component={FormActionsScreen} />
      <FormStack.Screen name="FormEffectiveness"    component={FormEffectivenessScreen} />
      <FormStack.Screen name="CanvasForm"           component={CanvasFormScreen} />
      <FormStack.Screen name="CanvasFormEdit"       component={CanvasFormEditScreen} />
      <FormStack.Screen name="ActionDetail"         component={ActionDetailScreen} />
      <FormStack.Screen name="CreateEffectiveness"  component={CreateEffectivenessScreen} />
    </FormStack.Navigator>
  );
}

// Paso de params
navigation.navigate('CanvasForm', { formId: item.id });
navigation.navigate('ActionDetail', { actionId: item.id });
navigation.navigate('CreateEffectiveness', {
  pamolsaActionDetailId: item.id,
  effectiveDate: item.effective_date
});
```

**Componentes presentados como modal / bottom sheet (no son Screen del stack):**

- `TableDetailBottomSheet` — abre desde dentro de `CanvasFormScreen`
- `EditPhotoModal` — abre desde `CanvasForm`, `TableDetail`, `Tracing`, `CreateEffectiveness`
- `FilterBottomSheet` — abre desde `FormActionsScreen` y `FormEffectivenessScreen`
- `UserSearchModal` — abre desde dentro de `FilterBottomSheet`
- `TracingBottomSheet` — abre desde `ActionDetailScreen`

---

## 5. Estado y lógica de negocio

### FormMenuScreen

- Al montar llama a `formService.getGeneralInfo()` → guarda en Zustand: `locals`, `forms`, `inspections`, `showPamolsa`, `users`, `pamolsaAreas`, `forms_titles`, `fieldsToValidate`.
- Pull-to-refresh: republica la carga.
- Visibilidad condicional de 3 ítems (Inspecciones, Seguimiento, Eficacia) según `showPamolsa`.

### CanvasFormScreen / CanvasFormEditScreen

- El formulario es completamente **dinámico**: su estructura viene del backend (`Forms → FormSection[] → FormDesign[]`).
- Cada `FormDesign` tiene un `field_type_id` que determina qué componente renderizar:

| `field_type_id` | Tipo de campo         | Componente RN                            |
| --------------- | --------------------- | ---------------------------------------- |
| 1               | Texto corto           | `TextInput`                              |
| 2               | Número                | `TextInput keyboardType="numeric"`       |
| 3               | Select simple         | Modal con lista                          |
| 4               | Select múltiple       | Modal con checkboxes                     |
| 5               | Textarea              | `TextInput multiline`                    |
| 6               | Radio                 | Custom `RadioGroup`                      |
| 7               | Checkbox              | Custom `Checkbox`                        |
| 8               | Firma / Canvas        | `react-native-signature-canvas`          |
| 9               | Foto                  | `expo-image-picker` + ActionSheet        |
| 10              | Fecha                 | `@react-native-community/datetimepicker` |
| 11              | Slider / Rango        | `@react-native-community/slider`         |
| 12              | Fecha + hora          | `@react-native-community/datetimepicker` |
| 16              | Campo de BD vinculado | Select encadenado desde `databases[]`    |
| Tabla           | Filas dinámicas       | `TableDetailBottomSheet`                 |

- Las secciones del formulario se navegan con slides horizontales → `ScrollView` paginado en RN.
- Los selects vinculados a BD (`db_data_id`) tienen lógica de cascada: seleccionar un valor filtra las opciones del siguiente campo (`fillArrayByProperty` → traducir a hook).
- La firma digital usa `react-native-signature-canvas` (ya en package.json).

### TableDetailBottomSheet

- Reemplaza `TableDetailPage` (modal de Ionic).
- Permite agregar, editar y eliminar filas de una tabla dentro del formulario.
- Cada fila tiene sus propios campos con los mismos `field_type_id`.
- Valida campos requeridos antes de guardar la fila.
- También puede abrir `EditPhotoModal` para editar fotos dentro de cada fila.

### EditPhotoModal

- Reemplaza `EditPhotoPage` (modal de Ionic).
- Recibe `currentPhoto` (base64 o URI) y permite dibujar anotaciones con un canvas táctil.
- Paleta de 8 colores para el trazo.
- Devuelve la imagen editada como base64.
- En RN: usar `react-native-signature-canvas` o `react-native-svg` para el canvas de dibujo anotación.

### FilterBottomSheet

- Reemplaza `FilterFormPage` (modal de Ionic).
- Campos: Planta/Local (`sede_selected`), Área (`area_selected`, dependiente de sede), Estado, Fuente, Acción propuesta (texto libre).
- Al seleccionar una sede, filtra las áreas disponibles de `fs.locals`.
- Botón "Filtrar" → devuelve los valores y dispara búsqueda.
- Botón "Cerrar" → devuelve con flag `close: true` sin aplicar.

### UserSearchModal

- Reemplaza `VirtualSelectComponent` (modal dentro de FilterFormPage).
- Lista de usuarios con buscador en tiempo real (`TextInput` + `FlatList` filtrada).
- Primera opción siempre es "Todos" (`id: '%'`).
- Al seleccionar, devuelve `{ id, name }` al `FilterBottomSheet`.

### TracingBottomSheet

- Reemplaza `TracingPage` (modal de Ionic) abierto desde `ActionDetailScreen`.
- Dos modos: **crear** (sin `tracingIndex`) y **visualizar** (con `tracingIndex`).
- Campos al crear: `registered_date` (auto, Lima), `execution_date`, `status` (0-3), `comments`, `photos[0]` y `photos[1]`.
- Al guardar con `status === 2` (Ejecutado) → cierra y navega a `FormEffectivenessScreen`.
- Al guardar con otro status → `useFocusEffect` en `FormActionsScreen` recarga la lista.
- Incluye cámara / galería y edición de fotos.

### ActionDetailScreen

- Lee `action_id` de los params → busca en `fs.actions` del store Zustand.
- Muestra detalle readonly: fecha de registro, estado, área, responsable, hallazgo, acciones propuestas, fecha propuesta.
- Lista de trazas con `CardComponent` → tap abre `TracingBottomSheet` en modo visualizar.
- Botón "Crear seguimiento" → abre `TracingBottomSheet` en modo crear.
- Al cerrar con cambio a `status === 2` → navega a `FormEffectivenessScreen`.

### CreateEffectivenessScreen

- Recibe `pamolsaActionDetailId` y `effectiveDate` como params.
- Campos: `effective_flag` (Sí/No, radio), `comments` (textarea), `effective_date` (datetime), `photos[0]` y `photos[1]`.
- Modo visualizar si la acción ya tiene `effective_flag` definido (botón Enviar oculto).
- Fechas: `minDate` = inicio del año, `maxDate` = +2 años.

**Store Zustand sugerido:**

```typescript
interface FormStore {
    forms: Forms[];
    locals: Local[];
    showPamolsa: boolean;
    pamolsaAreas: Area[];
    users: User[];
    forms_titles: Titles[];
    fieldsToValidate: FieldsValidation;
    behaviors_types: any[];
    inspections: any[];
    forms_records: FormsRecords[];
    actions: Action[];
    actions_executed: Action[];
    actions_header: any[];
    forms_saved_local: FormLocalSaved[];
    loadGeneralInfo: () => Promise<void>;
    loadStorage: () => Promise<void>;
    saveDataLocal: () => Promise<void>;
}
```

---

## 6. Servicios / API

| Método Ionic (`FormService`)                                | HTTP | En RN usar                    |
| ----------------------------------------------------------- | ---- | ----------------------------- |
| `getGeneralInfo()`                                          | GET  | `api.get('/general-info')`    |
| `getFormatsList({ user_id })`                               | GET  | `api.get('/formats')`         |
| `getListRecords({ last_id, user_selected, form_selected })` | GET  | `api.get('/records')`         |
| `getListActions({ last_id, ...filtros })`                   | GET  | `api.get('/actions')`         |
| `getListEffectiveness({ last_id, ...filtros })`             | GET  | `api.get('/effectiveness')`   |
| `getPamolsaRecords({ last_id, area_selected })`             | GET  | `api.get('/pamolsa-records')` |
| `saveCanvasForm(formData)`                                  | POST | `api.post('/canvas-form')`    |
| `saveDataPamolsaTracing(fieldsData)`                        | POST | `api.post('/tracing')`        |
| `saveEffectiveness(fieldsData)`                             | POST | `api.post('/effectiveness')`  |
| `getActionDetail({ action_id })`                            | GET  | `api.get('/action-detail')`   |

**Interceptor Axios (reemplaza `token.interceptor.ts`):**

```typescript
// src/services/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({ baseURL: "https://tu-backend.com/api" });

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
```

---

## 6b. Almacenamiento Local

### Mapa completo por pantalla

| Pantalla / Servicio    | Qué almacena                                | Ionic            | RN Expo                              |
| ---------------------- | ------------------------------------------- | ---------------- | ------------------------------------ |
| `FormMenuScreen`       | Token de autenticación                      | Storage de Ionic | `expo-secure-store`                  |
| `FormMenuScreen`       | Datos del usuario (`user`)                  | Storage de Ionic | `expo-secure-store` o `AsyncStorage` |
| `FormPendingScreen`    | Borradores sin enviar (`forms_saved_local`) | Storage de Ionic | `AsyncStorage`                       |
| `CanvasFormScreen`     | Borrador del formulario en edición          | Storage de Ionic | `AsyncStorage` (guardado al salir)   |
| `CanvasFormEditScreen` | Lee y actualiza borrador por índice         | Storage de Ionic | `AsyncStorage`                       |

### Claves de AsyncStorage propuestas

```typescript
// Token y sesión → expo-secure-store (datos sensibles)
await SecureStore.setItemAsync("auth_token", token);
await SecureStore.setItemAsync("user_data", JSON.stringify(user));

// Borradores locales → AsyncStorage
const FORMS_SAVED_KEY = "forms_saved_local";

// Guardar borrador
const saveDraft = async (draft: FormLocalSaved) => {
    const raw = await AsyncStorage.getItem(FORMS_SAVED_KEY);
    const current: FormLocalSaved[] = raw ? JSON.parse(raw) : [];
    current.push(draft);
    await AsyncStorage.setItem(FORMS_SAVED_KEY, JSON.stringify(current));
};

// Leer todos los borradores
const loadDrafts = async (): Promise<FormLocalSaved[]> => {
    const raw = await AsyncStorage.getItem(FORMS_SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
};

// Eliminar borrador por índice
const deleteDraft = async (index: number) => {
    const drafts = await loadDrafts();
    drafts.splice(index, 1);
    await AsyncStorage.setItem(FORMS_SAVED_KEY, JSON.stringify(drafts));
};

// Actualizar borrador editado
const updateDraft = async (index: number, updated: FormLocalSaved) => {
    const drafts = await loadDrafts();
    drafts[index] = updated;
    await AsyncStorage.setItem(FORMS_SAVED_KEY, JSON.stringify(drafts));
};
```

### Estructura del borrador (`FormLocalSaved`)

```typescript
interface FormLocalSaved {
    id: number;
    form_id: number;
    name: string; // nombre del formato
    user_id: number;
    created: string; // fecha de creación local (moment Lima)
    fields: Record<string, any>;
    form_data_ids: Record<string, any>;
    rows_deleted: any[];
    status: number; // 0 = borrador, 1 = enviado
}
```

### Operaciones por pantalla

**FormPendingScreen:**

- `loadDrafts()` → al montar con `useFocusEffect`
- `deleteDraft(index)` → tras confirmación `Alert.alert`
- Navega a `CanvasFormEdit` con `{ formId, index }`

**CanvasFormScreen (nuevo registro):**

- Al salir sin enviar → opción "Guardar borrador" → `saveDraft(formData)`
- Al enviar con éxito → no guarda nada localmente

**CanvasFormEditScreen (editar borrador):**

- Al montar → `loadDrafts()` → tomar ítem por índice
- Al guardar cambios sin enviar → `updateDraft(index, formData)`
- Al enviar con éxito → `deleteDraft(index)`

---

## 7. Consideraciones y riesgos

| #   | Consideración                                                  | Riesgo | Solución                                                                                            |
| --- | -------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| 1   | **CanvasForm dinámico** (37KB, múltiples tipos de campo)       | Alto   | Migrar campo por campo con la tabla de `field_type_id`. Prioridad crítica                           |
| 2   | **TableDetail** como modal con sus propios campos dinámicos    | Alto   | `TableDetailBottomSheet` con la misma lógica de renderizado dinámico                                |
| 3   | **EditPhoto** — canvas de anotación sobre foto                 | Medio  | `react-native-signature-canvas` o `react-native-svg` para el canvas                                 |
| 4   | **VirtualSelectComponent** — lista virtualizada de usuarios    | Bajo   | `FlatList` con `TextInput` de búsqueda en Modal nativo RN                                           |
| 5   | **FilterFormPage** — selects encadenados (sede → área)         | Bajo   | `FilterBottomSheet` con misma lógica de cascada desde `fs.locals`                                   |
| 6   | **Selects encadenados por BD** (`db_data_id`, cascada)         | Medio  | Lógica `fillArrayByProperty` traducida a hooks de RN                                                |
| 7   | **Firma digital** (`field_type_id === 8`, canvas HTML5)        | Medio  | `react-native-signature-canvas` (ya en package.json)                                                |
| 8   | **Geolocalización** (`LocationService`) en campos del form     | Bajo   | `expo-location` (ya en package.json)                                                                |
| 9   | **Guardado local** de borradores (`forms_saved_local`)         | Bajo   | `AsyncStorage` con la estructura `FormLocalSaved`                                                   |
| 10  | **`Events` de Ionic** entre pantallas                          | Bajo   | `useFocusEffect` + Zustand reactivo                                                                 |
| 11  | **TracingPage** navega a Effectiveness tras estado "Ejecutado" | Medio  | Al cerrar `TracingBottomSheet` con `status === 2`, navegar directamente a `FormEffectivenessScreen` |
| 12  | **`ion-slides`** para navegación de secciones del form         | Bajo   | `ScrollView` horizontal paginado + indicadores de progreso custom                                   |

---

## 8. Checklist de migración

### FormMenuScreen

- [ ] Header custom con logos y barra tricolor
- [ ] Grid de menú con 5 ítems (3 condicionales por `showPamolsa`)
- [ ] Íconos SVG: `formato.svg`, `registros.svg`, `pendiente.svg`, `inspeccion.svg`, `seguimiento.svg`, `eficacia.svg`
- [ ] Llamada a `getGeneralInfo` al montar → guardar en Zustand
- [ ] Pull-to-refresh (`RefreshControl`)
- [ ] Botón "Volver" al pre-main

### FormFormatsScreen

- [ ] Lista de formatos desde `fs.forms`
- [ ] Ítem adicional "Hallazgo SST" si `showPamolsa`
- [ ] Navegar a `CanvasForm` con `formId`
- [ ] Pull-to-refresh con debounce (>2 seg)

### FormRecordsScreen

- [ ] `FlatList` con paginación infinita (`last_id` cursor)
- [ ] `CardComponent` con título, fecha y estado
- [ ] Navegar a `CanvasForm` con `formDataIndex` + `formId`
- [ ] Pull-to-refresh (reset lista y `last_id`)

### FormPendingScreen

- [ ] Cargar borradores de `AsyncStorage` con `useFocusEffect`
- [ ] Lista con ícono editar y eliminar por ítem
- [ ] Confirmación de eliminación → `Alert.alert` → `deleteDraft(index)`
- [ ] Navegar a `CanvasFormEdit` con `formId` e índice

### FormPamolsaScreen

- [ ] `FlatList` paginada con `last_id`
- [ ] Filtro por área (Picker / modal)
- [ ] Apertura automática por param `active_action`

### FormActionsScreen

- [ ] `FlatList` paginada con `last_id`
- [ ] Botón "Filtros" → `FilterBottomSheet`
- [ ] Card especial con `proposed_actions`, `proposed_date`, `risk_level`
- [ ] Navegar a `ActionDetailScreen`

### FilterBottomSheet

- [ ] Campo Planta/Local (`sede_selected`) con Picker
- [ ] Campo Área (`area_selected`) — dependiente de sede seleccionada
- [ ] Campo Estado (Todos / Fuera de fecha / Pendiente)
- [ ] Campo Fuente (8 opciones fijas)
- [ ] Campo Acción propuesta (TextInput libre)
- [ ] `UserSearchModal` para seleccionar responsable
- [ ] Botón "Filtrar" → retorna valores
- [ ] Botón "Cerrar" → retorna con `close: true`

### UserSearchModal

- [ ] `TextInput` de búsqueda en tiempo real
- [ ] `FlatList` con usuarios filtrados
- [ ] Primera opción fija: "Todos" (`id: '%'`)
- [ ] Al seleccionar → devuelve `{ id, name }` al sheet padre

### ActionDetailScreen

- [ ] Leer `action_id` de params → buscar en store Zustand
- [ ] Campos readonly (fecha, estado, área, responsable, hallazgo, acciones, fecha propuesta)
- [ ] Lista de trazas con `CardComponent`
- [ ] Tap en traza → `TracingBottomSheet` modo visualizar
- [ ] Botón "Crear seguimiento" → `TracingBottomSheet` modo crear
- [ ] Al cerrar con `status === 2` → navegar a `FormEffectivenessScreen`

### TracingBottomSheet

- [ ] Modo crear: campos `execution_date`, `status` (0-3), `comments`, `photos[2]`
- [ ] Modo visualizar: todos readonly
- [ ] `registered_date` auto con moment Lima
- [ ] Fotos con ActionSheet (tomar / galería / editar / eliminar)
- [ ] `EditPhotoModal` para cada foto
- [ ] Al guardar `status === 2` → cerrar y navegar a `FormEffectivenessScreen`

### FormEffectivenessScreen

- [ ] `FlatList` paginada con `last_id`
- [ ] Botón "Filtros" → `FilterBottomSheet`
- [ ] Card especial con `proposed_actions`, `effective_date`, `risk_level`
- [ ] Navegar a `CreateEffectivenessScreen`

### CreateEffectivenessScreen

- [ ] Campo `effective_flag` (radio: Sí / No)
- [ ] Campo `comments` (TextInput multiline)
- [ ] Campo `effective_date` (DateTimePicker con min/max)
- [ ] Dos campos de foto con ActionSheet
- [ ] `EditPhotoModal` para cada foto
- [ ] Modo visualizar si ya tiene `effective_flag`
- [ ] Botón "Enviar" oculto en modo visualizar

### CanvasFormScreen / CanvasFormEditScreen

- [ ] Renderizado dinámico por `field_type_id` (tabla completa en sección 5)
- [ ] Navegación entre secciones con `ScrollView` horizontal paginado
- [ ] Validación de campos requeridos por sección
- [ ] Selects encadenados desde `databases[]` con lógica de cascada
- [ ] Firma digital con `react-native-signature-canvas`
- [ ] Fotos con `expo-image-picker` + ActionSheet
- [ ] `TableDetailBottomSheet` para campos de tabla
- [ ] `EditPhotoModal` para fotos
- [ ] Guardar como borrador en `AsyncStorage` al salir sin enviar → `saveDraft()`
- [ ] `CanvasFormEditScreen`: leer borrador por índice → editar → `updateDraft()` o enviar → `deleteDraft()`

### EditPhotoModal

- [ ] Recibe `currentPhoto` (base64 / URI)
- [ ] Canvas de anotación táctil
- [ ] Paleta de 8 colores
- [ ] Botón guardar → devuelve imagen editada como base64
- [ ] Botón cerrar → no modifica

### Infraestructura compartida

- [ ] Interceptor Axios con token Bearer desde `expo-secure-store`
- [ ] Store Zustand con slice de Formularios
- [ ] `AsyncStorage` para borradores — helpers: `saveDraft`, `loadDrafts`, `updateDraft`, `deleteDraft`
- [ ] `expo-secure-store` para token y datos de sesión
- [ ] Componente `CardComponent` reutilizable
- [ ] Componente `Header` con logos y barra tricolor
- [ ] `FilterBottomSheet` con selects encadenados (sede → área)
- [ ] `UserSearchModal` con `FlatList` filtrada
- [ ] Utilidad de paginación con cursor `last_id`
- [ ] Helper de fotos: permisos, tomar, galería, base64
