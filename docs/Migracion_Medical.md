# Migración: Flujo Medical (Descanso Médico)

---

**Origen:** `E:\ionic_projects\pamolsa-app`

## 1. Árbol de pantallas (Ionic)

```
/medical-menu           → pages/medical/menu/          (MenuPage)
  ├── /form-rest        → pages/medical/form-rest/     (FormRestPage)    ← formulario con fotos
  ├── /list-rest        → pages/medical/list-rest/     (ListRestPage)    ← registros enviados
  └── [externo]         → https://simplexgo.com/covid/pamolsa/public/    ← Sintomatología (InAppBrowser)
```

**Nota:** El acceso a `/form-rest` está condicionado: si el usuario acumuló ≥ 21 días de descanso médico en el año, se muestra una alerta y se bloquea la navegación.

---

## 2. Árbol de pantallas propuesto (React Native Expo)

```
MedicalMenuScreen         (Stack.Screen - entrada al flujo)
  ├── FormRestScreen      (formulario de descanso médico con cámara y fotos)
  ├── ListRestScreen      (historial de solicitudes de descanso)
  └── [externo]           → expo-web-browser (Sintomatología COVID)
```

---

## 3. Tabla de equivalencias de componentes

| Ionic                                       | React Native Expo                                | Notas                                             |
| ------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `ion-header` / `ion-toolbar`                | Custom `Header` component                        | Logos + barra tricolor                            |
| `ion-card`                                  | Custom `MedicalRestCard` component               | Props: topic, reason, doctor, dateInit/End, state |
| `ion-button color="warning/success/danger"` | `TouchableOpacity` con color por estado          | PENDIENTE/APROBADO/RECHAZADO                      |
| `ion-grid / ion-row / ion-col`              | `View` con `flexDirection` y `flex`              |                                                   |
| `ion-select` / `ion-select-option`          | `Picker` (RN community) o modal custom           | Para selección de Planta/Local (4 opciones fijas) |
| `ion-datetime`                              | `@react-native-community/datetimepicker`         | Ya en package.json                                |
| `ion-input` (disabled)                      | `TextInput editable={false}`                     | DNI y nombre del usuario (solo lectura)           |
| `ion-img`                                   | `Image` de React Native                          | Muestra la foto tomada antes de enviar            |
| `ion-button` (Foto)                         | `TouchableOpacity` → `ActionSheet` custom        | Reemplaza `ActionSheetController`                 |
| `Camera` (Ionic Native)                     | `expo-camera` + `expo-image-picker`              | Ya en package.json                                |
| `ModalController` (EditPhotoPage)           | `Modal` de React Native o `@gorhom/bottom-sheet` | Para recorte/edición de foto                      |
| `AlertController`                           | `Alert.alert(...)`                               |                                                   |
| `InAppBrowser` (Ionic Native)               | `expo-web-browser` (`openBrowserAsync`)          | Para abrir URL de Sintomatología                  |
| `ion-footer`                                | `View` fijo abajo + `SafeAreaView`               |                                                   |
| `moment-timezone`                           | `moment-timezone` (ya en package.json)           | Para `date_init_topic` (fecha/hora actual Lima)   |

---

## 4. Navegación

**Ionic (Router Angular):**

- Rutas planas: `/medical-menu`, `/form-rest`, `/list-rest`
- `InAppBrowser.create(url, '_blank')` para Sintomatología

**React Native Expo (React Navigation v6+):**

```typescript
const MedicalStack = createStackNavigator();

export function MedicalNavigator() {
  return (
    <MedicalStack.Navigator>
      <MedicalStack.Screen name="MedicalMenu"  component={MedicalMenuScreen} />
      <MedicalStack.Screen name="FormRest"     component={FormRestScreen} />
      <MedicalStack.Screen name="ListRest"     component={ListRestScreen} />
    </MedicalStack.Navigator>
  );
}
```

**Lógica de navegación condicional del menú:**

```typescript
// MedicalMenuScreen - al tocar "Descanso Médico"
const handleGoForm = () => {
    if (restDay >= 21) {
        Alert.alert(
            "Límite alcanzado",
            "Acercarse a Tópico, se superó los 21 días anuales",
        );
    } else {
        navigation.navigate("FormRest");
    }
};

// Para Sintomatología
const handleGoWeb = async () => {
    await WebBrowser.openBrowserAsync(
        "https://simplexgo.com/covid/pamolsa/public/",
    );
};
```

---

## 5. Estado y lógica de negocio

### MedicalMenuScreen

- Al montar, llama a `medicalService.getInfoUser({ dni })` para obtener `rest_day`.
- Muestra 3 opciones: Descanso Médico, Sintomatología (externo), Registros.
- La opción "Descanso Médico" bloquea la navegación si `rest_day >= 21`.

### FormRestScreen

- Formulario con los siguientes campos:

| Campo                    | Tipo Ionic             | Tipo RN                           | Requerido |
| ------------------------ | ---------------------- | --------------------------------- | --------- |
| Planta / Local (`topic`) | `ion-select`           | `Picker` / Modal selector         | ✅        |
| Fecha de Registro        | `ion-datetime`         | `DateTimePicker` (disabled, auto) | —         |
| DNI                      | `ion-input` (read)     | `TextInput editable={false}`      | —         |
| Apellidos y Nombres      | `ion-input` (read)     | `TextInput editable={false}`      | —         |
| Inicio de Descanso       | `ion-datetime`         | `DateTimePicker`                  | ✅        |
| Fin de Descanso          | `ion-datetime`         | `DateTimePicker`                  | ✅        |
| Certificado (foto)       | `Camera + ActionSheet` | `expo-image-picker` + ActionSheet | ⬜        |
| Prescripción (foto)      | `Camera + ActionSheet` | `expo-image-picker` + ActionSheet | ⬜        |
| Consulta Médica (foto)   | `Camera + ActionSheet` | `expo-image-picker` + ActionSheet | ⬜        |
| Comprobante Pago (foto)  | `Camera + ActionSheet` | `expo-image-picker` + ActionSheet | ⬜        |

**Validación de campos requeridos:**

```typescript
// Ionic usaba clases CSS para marcar requeridos visualmente
// En RN usar bordes/colores en los componentes
const [errors, setErrors] = useState<Record<string, boolean>>({});

const validateFields = () => {
    const newErrors: Record<string, boolean> = {};
    const required = ["topic", "date_init", "date_end"];
    required.forEach((field) => {
        if (!formData[field] || formData[field] === "") {
            newErrors[field] = true;
        }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
```

**Manejo de fotos (reemplaza `Camera` de Ionic Native):**

```typescript
import * as ImagePicker from "expo-image-picker";

const takePhoto = async (field: string) => {
    // Pedir permiso de cámara
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true, // si el backend espera base64
    });

    if (!result.canceled) {
        setFormData((prev) => ({ ...prev, [field]: result.assets[0].uri }));
    }
};

// Action Sheet (reemplaza ActionSheetController)
const showPhotoOptions = (field: string, label: string) => {
    Alert.alert(label, "Seleccionar opción", [
        { text: "Tomar foto", onPress: () => takePhoto(field) },
        { text: "Galería", onPress: () => pickFromGallery(field) },
        { text: "Cancelar", style: "cancel" },
    ]);
};
```

**`EditPhotoPage` (modal de edición):**

- En Ionic se abría un modal para editar/recortar la foto.
- En RN: usar `expo-image-manipulator` o simplemente mostrar la foto y permitir retomar.

**Envío del formulario:**

- `formData.date_init_topic` se setea automáticamente con `moment().format()` al cargar la pantalla (timezone Lima).
- Se envía la data incluyendo las URLs/base64 de las fotos.

### ListRestScreen

- Lista de solicitudes del usuario cargadas por DNI.
- Cada ítem muestra: Tópico, Lugar de Emisión, Motivo, Técnico, Fechas de permiso, Estado.
- Estados posibles: `PENDIENTE` (warning), `APROBADO` (success), `RECHAZADO` (danger).
- Si estado es `RECHAZADO`, se muestra el campo `post_reason` (motivo de rechazo).
- Sin paginación (carga todo de una vez).

**Store Zustand sugerido:**

```typescript
interface MedicalStore {
    restDay: number;
    records: MedicalRest[];
    formData: MedicalFormData;
    setRestDay: (days: number) => void;
    setRecords: (records: MedicalRest[]) => void;
    resetFormData: () => void;
    updateFormField: (field: string, value: any) => void;
}

interface MedicalFormData {
    dni: string;
    topic: string;
    date_init: string;
    date_end: string;
    date_init_topic: string;
    url_cert: string;
    url_prescription: string;
    url_medical_consult: string;
    url_payment: string;
}
```

---

## 6. Servicios / API

| Método Ionic (`MedicalService`) | Endpoint esperado           | En RN usar   |
| ------------------------------- | --------------------------- | ------------ |
| `getInfoUser({ dni })`          | GET `/medical/user?dni=...` | `axios.get`  |
| `getRestMedical({ dni })`       | GET `/medical/records`      | `axios.get`  |
| `submitFormRest(formData)`      | POST `/medical/rest`        | `axios.post` |

Las fotos se envían preferiblemente como `multipart/form-data` usando `FormData` de React Native:

```typescript
const sendData = async () => {
    const data = new FormData();
    data.append("dni", formData.dni);
    data.append("topic", formData.topic);
    data.append("date_init", formData.date_init);
    data.append("date_end", formData.date_end);

    if (formData.url_cert) {
        data.append("url_cert", {
            uri: formData.url_cert,
            type: "image/jpeg",
            name: "cert.jpg",
        } as any);
    }
    // ... resto de fotos

    await api.post("/medical/rest", data, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};
```

---

## 7. Consideraciones y riesgos

| #   | Consideración                                            | Riesgo | Solución                                                                                           |
| --- | -------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| 1   | **`Camera` de Ionic Native** no existe en Expo           | Alto   | `expo-image-picker` + `expo-camera` (ya en package.json)                                           |
| 2   | **`InAppBrowser` de Ionic Native**                       | Bajo   | `expo-web-browser` (`openBrowserAsync`) — ya en package.json                                       |
| 3   | **`ion-datetime`** para fechas con formato personalizado | Bajo   | `@react-native-community/datetimepicker` — ya en package.json                                      |
| 4   | **`ion-select`** con 4 opciones fijas para Planta/Local  | Bajo   | `Picker` o modal custom con lista de opciones                                                      |
| 5   | **`ActionSheetController`** para opciones de foto        | Bajo   | `Alert.alert` con botones múltiples                                                                |
| 6   | **`EditPhotoPage`** modal para editar fotos              | Medio  | Simplificar: permitir retomar foto. Si se requiere edición avanzada, usar `expo-image-manipulator` |
| 7   | **Validación visual** con clases CSS (`.required`)       | Bajo   | Estado de errores por campo en RN, borde rojo en input                                             |
| 8   | **Subida de fotos** como base64 vs multipart             | Medio  | Verificar con el backend qué formato acepta. `multipart/form-data` es más eficiente                |
| 9   | **Permisos de cámara y galería**                         | Bajo   | Solicitar permisos antes de abrir cámara/galería con `expo-image-picker`                           |
| 10  | **Lógica de 21 días** (`rest_day >= 21`) en el menú      | Bajo   | Cargar `rest_day` al montar `MedicalMenuScreen` y guardar en store                                 |

---

## 8. Checklist de migración

### MedicalMenuScreen

- [ ] Header custom con logos y barra tricolor
- [ ] Saludo con nombre del usuario (`us.user.name`)
- [ ] Imagen de portada `portrait_medical.png`
- [ ] Grid con 3 opciones: Descanso Médico, Sintomatología, Registros
- [ ] Íconos SVG: `care.svg`, `covid_svg.svg`, `records_care.svg`
- [ ] Llamada a `getInfoUser` al montar para obtener `rest_day`
- [ ] Lógica condicional: si `rest_day >= 21` → `Alert.alert` y no navegar a `FormRest`
- [ ] Botón "Sintomatología" → `expo-web-browser`
- [ ] Botón "Volver" al pre-main

### FormRestScreen

- [ ] Header "Descanso Medico"
- [ ] Campo Planta/Local (Picker con 4 opciones: Faucett, Gambetta, Recicloplast, Despro)
- [ ] Campo Fecha de Registro (readonly, auto con moment Lima)
- [ ] Campo DNI (readonly desde store de usuario)
- [ ] Campo Apellidos y Nombres (readonly desde store de usuario)
- [ ] Campo Inicio de Descanso (`DateTimePicker`)
- [ ] Campo Fin de Descanso (`DateTimePicker`)
- [ ] Campo Certificado de Descanso → botón "Foto" + preview
- [ ] Campo Prescripción → botón "Foto" + preview
- [ ] Campo Consulta Médica → botón "Foto" + preview
- [ ] Campo Comprobante de Pago → botón "Foto" + preview
- [ ] Permisos de cámara y galería solicitados on-demand
- [ ] Action Sheet para cada campo de foto (Tomar foto / Galería / Cancelar)
- [ ] Validación de campos requeridos con feedback visual (borde rojo)
- [ ] Alert de error si faltan campos requeridos
- [ ] Envío del formulario con `multipart/form-data`
- [ ] Botón "Enviar" en footer

### ListRestScreen

- [ ] Header "Solicitudes de Descanso Medico"
- [ ] `FlatList` de registros por usuario
- [ ] Card por registro con:
    - [ ] Tópico, Lugar de Emisión
    - [ ] Motivo de Descanso
    - [ ] Nombre del Técnico
    - [ ] Rango de fechas formateado `dd/MM/yyyy`
    - [ ] Fecha de Solicitud
    - [ ] Badge de estado (PENDIENTE/APROBADO/RECHAZADO) con color
    - [ ] Motivo de rechazo (solo si `state === 'RECHAZADO'`)
- [ ] Botón "Volver" al `MedicalMenu`

### Infraestructura

- [ ] `MedicalService` con los 3 endpoints
- [ ] Store Zustand con slice Medical
- [ ] Permisos de cámara configurados en `app.json` (Expo)
- [ ] Helper para manejo de `FormData` con archivos adjuntos
- [ ] Timezone Lima configurada globalmente para `moment`
