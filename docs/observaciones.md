# Migración: Hallazgo SST (Pamolsa Action Form)

## **Origen:** `E:\ionic_projects\pamolsa-app`

## 1. Contexto

Se observa que la pagina pamolsa_action_form (archivos .ts .html y .scss) y sus subvistas no estan migradas totalmente

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

### Observaciones

- No se ha leido completamente los archivos relacionados (.ts , .html y .scss) y sus subvistas de pamolsa_action_form
- No se ha respetado que el formulario esta en secciones
- Falta campos como por ejemplo el input Fuente el cual muetras opciones en radio button
- Existe campos que al seleccionarlos aparece otros campos como por ejemplo al seccionar Inspeccion SST aparece el campo categoria ( list )
- Revisa que algunos inputs son anidados por ende si cambia uno ,se debe limpiar los demas valores.
- Tambien revisa las tablas en dicho formulario que son 2 los cuales llaman a PamolsaActionFormDetailPage y un componentProps como puedes ver en el archivo pamolsa-action-form.page.ts y pamolsa-action-form-detail.page.ts
