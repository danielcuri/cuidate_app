# Migración: Hallazgo SST (Pamolsa Action Form)

## **Origen:** `E:\ionic_projects\pamolsa-app`

## 1. Contexto

Este documento define la migración del formulario **Hallazgo SST** desde Ionic (**Origen**) hacia EXPO.

### Origen (Ionic)

```
pages/application-form/formats/
   └── formats.module
         └── pamolsa-action-form/
               ├── pamolsa-action-form.page.ts
               └── pamolsa-action-form-detail.page.ts
```

### Destino (EXPO)

```
src/screens/form/
   ├── FormFormatsScreen.tsx
   └── pamolsa/
        ├── PamolsaActionFormScreen.tsx
        └── PamolsaActionFormDetailScreen.tsx
```

---

## 2. Alcance

Este flujo incluye únicamente:

1. FormFormatsScreen (integración)
2. PamolsaActionFormScreen (creación)
3. PamolsaActionFormDetailScreen (detalle)

❌ No incluye:

- CanvasForm
- Actions
- Effectiveness

---

## 3. Flujo

```
FormFormatsScreen
   → PamolsaActionFormScreen
         → PamolsaActionFormDetailScreen
```

---

## 4. Integración en FormFormatsScreen

### Condición

```
fs.showPamolsa === true
```

### Item

```ts
const pamolsaItem = {
    id: "pamolsa_action",
    name: "Hallazgo SST",
    isStatic: true,
};
```

### Lista

```ts
const formatsList = [...fs.forms, ...(fs.showPamolsa ? [pamolsaItem] : [])];
```

### Navegación

```ts
if (item.isStatic) {
    navigation.navigate("PamolsaActionForm");
}
```

---

## 5. PamolsaActionFormScreen

### Responsabilidad

- Crear hallazgo
- Registrar datos
- Enviar al backend
- Navegar a detalle

### Campos

- sede
- área
- descripción
- nivel de riesgo
- acción propuesta
- fecha propuesta
- responsable
- fotos (2)

### API

```ts
await api.post("/pamolsa-action", payload);
```

### Navegación

```ts
navigation.navigate("PamolsaActionFormDetail", {
    actionId: response.data.id,
});
```

---

## 6. PamolsaActionFormDetailScreen

### Responsabilidad

- Mostrar detalle del hallazgo

### Datos

- fecha
- usuario
- sede
- área
- descripción
- riesgo
- acción propuesta
- responsable
- fotos

### API

```ts
api.get("/action-detail", { action_id });
```

---

## 7. Navegación

```ts
<FormStack.Screen name="PamolsaActionForm" component={PamolsaActionFormScreen} />
<FormStack.Screen name="PamolsaActionFormDetail" component={PamolsaActionFormDetailScreen} />
```

---

## 8. Reutilización

- EditPhotoModal
- UserSearchModal
- Header
- api.ts
- Zustand store

---

## 9. Checklist

### Formats

- [ ] Agregar item
- [ ] Navegación

### Form

- [ ] Inputs
- [ ] Fotos
- [ ] Submit

### Detail

- [ ] Mostrar datos

---

## 10. Conclusión

El flujo Hallazgo SST es independiente del sistema dinámico y debe migrarse como módulo separado dentro de form.
