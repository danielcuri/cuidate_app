## Objetivo
Completar la migración de la vista (Pamolsa) al proyecto **Expo**, respetando lo que ya está avanzado y replicando fielmente el **diseño/flujo** de la versión **Ionic**.

## Origen (Ionic) – leer completo
Tomar como referencia estas pantallas (HTML/TS/SCSS):

- `@pamolsa-app-ionic/src/app/pages/pamolsa-action-form/pamolsa-action-form.page.html`
- `@pamolsa-app-ionic/src/app/pages/pamolsa-action-form/pamolsa-action-form.module.ts`
- `@pamolsa-app-ionic/src/app/pages/pamolsa-action-form/pamolsa-action-form.page.ts`
- `@pamolsa-app-ionic/src/app/pages/pamolsa-action-form/pamolsa-action-form.page.scss`

En esa vista, según revisión del HTML/TS, se llama a `pamolsa-action-form-detail` como **modal**. Además, revisando `pamolsa-action-form-detail`, se observa que también se invoca como modal al **mismo componente** según una condicional.

- `@pamolsa-app-ionic/src/app/pages/pamolsa-action-form-detail/pamolsa-action-form-detail.page.html`
- `@pamolsa-app-ionic/src/app/pages/pamolsa-action-form-detail/pamolsa-action-form-detail.module.ts`
- `@pamolsa-app-ionic/src/app/pages/pamolsa-action-form-detail/pamolsa-action-form-detail.page.ts`
- `@pamolsa-app-ionic/src/app/pages/pamolsa-action-form-detail/pamolsa-action-form-detail.page.scss`

En `pamolsa-action-form-detail` se utiliza el componente/página `edit-photo`:

- `@pamolsa-app-ionic/src/app/pages/edit-photo/edit-photo.page.ts`
- `@pamolsa-app-ionic/src/app/pages/edit-photo/edit-photo.page.html`
- `@pamolsa-app-ionic/src/app/pages/edit-photo/edit-photo.page.scss`
- `@pamolsa-app-ionic/src/app/pages/edit-photo/edit-photo.module.ts`

## Destino (Expo) – ya tiene avance
Hay **2 procesos** que llegan a `PamolsaActionform`:

- **Edición**: parte desde `ListPamolsa.tsx` (editar según condiciones definidas en Ionic).
- **Formulario libre**: parte desde `Formats.tsx` (abre el formulario “en blanco”).

Archivos destino en Expo (ajustar a la ruta real del repo):

- `@cuidate_app_expo/src/screens/form/pamolsa/PamolsaActionform.tsx`
- `@cuidate_app_expo/src/screens/form/pamolsa/PamolsaActionformDetail.tsx`
- `@cuidate_app_expo/src/screens/form/pamolsa/PamolsaActionformDetailModal.tsx`

Para el proceso que viene de `ListPamolsa.tsx`, tomar en cuenta la **búsqueda dentro del array** y la **precarga** con sus valores (revisar cómo lo hace la vista origen en Ionic).

## Endpoint: respuesta y forma
**POST** `"/getPamolsaRecords"`

### Input (opcional)
En `area_selected` enviar el **id** del área seleccionada en filtro. El valor por defecto es `"%"`.

```json
{
  "last_id": 0,
  "area_selected": "%"
}
```

### Response (ejemplo)
```json
{
  "actions_header": [
    {
      "id": 2761,
      "user_id": 72,
      "register_number": "2761",
      "registered_date": "2023-05-09T10:24:00+00:00",
      "turn": null,
      "type": "No Planeada",
      "inspection_id": null,
      "others_type": null,
      "detail": null,
      "local_id": 1,
      "area_id": 32,
      "area_responsable": "JIMENEZ BENAVIDES, VICTOR FIDEL",
      "area_responsable_id": 7,
      "turn_engineer": null,
      "risk_level": null,
      "risk_level_type": null,
      "inspection_result": "Se reporta condicion subestandar. Se comunico Lucio Loma.",
      "causes": "por diseño de máquina",
      "charge_responsable": "Prevencionista",
      "responsable_date": "2023-05-09T10:24:00+00:00",
      "responsable_sign_url": "https://tekobu.com/storage/signatures/5fb34bd877d26-signature_url.png",
      "status": 0,
      "approved": 0,
      "restart": 0,
      "created_at": "2023-05-09T10:36:35.000000Z",
      "updated_at": "2023-05-09T10:36:35.000000Z",
      "deleted_at": null,
      "register_type": "Seguridad Industrial",
      "send_notification": 0,
      "comment": null,
      "page": "/pamolsa-action-form",
      "created": "09/05/2023 10:24 AM",
      "name": "Inspección de seguridad y salud en el trabajo",
      "parameters": {
        "action_header_index": 2761
      },
      "details": [
        {
          "id": 5783,
          "pamolsa_action_id": 2761,
          "findings": "Se observo fajas del mecanismo del alimentador de tapas de la máquina Ketan 50, parte posterior la guarda no cubre por completo.",
          "type": null,
          "pamolsa_behavior_type_id": 3,
          "pamolsa_behavior_id": 29,
          "other_behavior": null,
          "risk": "Atrapamiento",
          "consequence": "Golpes,fracturas",
          "risk_level": "Medio",
          "photos_url": [
            "https://tekobu.com/storage/pamolsa_actions_details/pimpeo645a68831105b-pimpeo-photo.jpg",
            "https://tekobu.com/storage/pamolsa_actions_details/pimpeo645a6883118a8-pimpeo-photo.jpg"
          ],
          "proposed_actions": null,
          "comments_effectiveness": null,
          "effective_flag": null,
          "photos_url_effectiveness": null,
          "area_responsable": "JIMENEZ BENAVIDES, VICTOR FIDEL",
          "area_responsable_id": 7,
          "proposed_date": null,
          "proposed_date_modified": null,
          "effective_date": null,
          "status": 0,
          "approved": null,
          "created_at": "2023-05-09T10:36:35.000000Z",
          "updated_at": "2023-05-09T10:36:35.000000Z",
          "deleted_at": null,
          "pamolsa_action_detail_id": null,
          "details": [
            {
              "id": 5784,
              "pamolsa_action_id": null,
              "findings": null,
              "type": null,
              "pamolsa_behavior_type_id": null,
              "pamolsa_behavior_id": null,
              "other_behavior": null,
              "risk": null,
              "consequence": null,
              "risk_level": null,
              "photos_url": [],
              "proposed_actions": "Colocar guarda completa",
              "comments_effectiveness": null,
              "effective_flag": null,
              "photos_url_effectiveness": null,
              "area_responsable": "JIMENEZ BENAVIDES, VICTOR FIDEL",
              "area_responsable_id": 7,
              "proposed_date": "2023-05-24",
              "proposed_date_modified": null,
              "effective_date": null,
              "status": 0,
              "approved": null,
              "created_at": "2023-05-09T10:36:35.000000Z",
              "updated_at": "2023-05-09T10:36:35.000000Z",
              "deleted_at": null,
              "pamolsa_action_detail_id": 5783
            }
          ]
        }
      ],
      "user": {
        "id": 72,
        "team_id": null,
        "name": "GARAGATTI ROJAS, CARLOS",
        "email": "Carlos.garagatti@carvajal.com",
        "signature_url": "signatures/5fb34bd877d26-signature_url.png",
        "created_at": "2020-10-16T22:01:38.000000Z",
        "updated_at": "2022-07-24T07:21:27.000000Z",
        "deleted_at": null,
        "dni": "43468966",
        "flag_web": 0
      }
    }
  ],
  "lastIteraction": 2752,
  "last_idssss": null
}
```

## Reglas (obligatorias)
- Leer primero `PamolsaActionForm.tsx` actual y **respetar lo que ya funciona**.
- Analizar el origen Ionic completo: **lógica, diseño, flujo y estilos**.
- Respetar fielmente el **diseño visual** de la versión Ionic.
- Usar `StyleSheet.create({})` para todos los estilos (al final del archivo).
- Generar **interfaces TypeScript** basadas en la respuesta del endpoint. Si ya existen, **adaptarlas sin romper** vistas que las consumen.
- Usar **React Navigation** para cualquier navegación.
- Reemplazar plugins **Cordova** por equivalentes **Expo**.
- Nunca usar `any` en TypeScript.
- Antes de crear un componente, revisar si ya existe y **reutilizarlo** sin afectar otras vistas.
- Solo agregar o corregir lo que falta. **No reescribir** lo que ya funciona.
- El diseño final debe verse **igual** a la versión Ionic.
- Tomar en cuenta las condicionales usadas para dejar un campo **disabled** o no.
