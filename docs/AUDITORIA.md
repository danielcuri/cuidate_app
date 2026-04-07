# Auditoría Ionic → Expo

**Origen:** `E:\ionic_projects\pamolsa-app`  
**Destino previsto:** `E:\react-native\cuidate-app`  
**Alcance:** Solo análisis (sin código de migración).  
**Fecha de inventario:** 2026-03-30  

---

## 1. Páginas y componentes (~50)

Inventario de `*.page.ts` bajo `src/app/pages/` y componentes declarados bajo `src/app/components/`.  
**Complejidad:** criterio heurístico (formularios dinámicos, modales anidados, multimedia = mayor carga).  
**Tipo:** según uso principal en el enrutador o como modal embebido.

| Nombre | Origen | Tipo | Ruta / uso | Complejidad | Estilos propios (.page.scss / .component.scss) | Plugins / libs nativas en la pantalla |
|--------|--------|------|------------|-------------|-----------------------------------------------|----------------------------------------|
| Action detail | pages | Ruta | `/action-detail` | Media | Sí | — |
| Actions | pages | Ruta | `/actions` y `tabs/actions` | Media | Sí | — |
| Answers | pages | [PENDIENTE] Sin ruta activa en `app-routing` | — | Media | Sí | vía `EnterpriseService` (HTTP) |
| Application-form: actions | pages | Ruta | `/form-actions` | Media | Sí | — |
| Application-form: effectiveness | pages | Ruta | `/form-effectiveness` | Media | Sí | modales (`FilterForm`) |
| Application-form: filter-form | pages | Modal / embebido | Importado en `effectiveness` y `actions` (no ruta raíz) | Media | No | — |
| Application-form: formats | pages | Ruta | `/form-formats` | Media | Sí | — |
| Application-form: list-pamolsa | pages | Ruta | `/form-list-pamolsa` | Media | Sí | — |
| Application-form: list-pending | pages | Ruta | `/form-list-pending` | Simple | Sí | — |
| Application-form: menu | pages | Ruta | `/form-menu` | Media | Sí | — |
| Application-form: records | pages | Ruta | `/form-records` | Media | Sí | — |
| Canvas | pages | Tab hijo | `/tabs/canvas` | Media | Sí | **InAppBrowser** (`create`) |
| Canvas-form | pages | Ruta | `/canvas-form` | Alta | Sí | **Camera**, **Geolocation** (`LocationService` → `getCurrentPosition`), `ionic-selectable`, modales (`TableDetail`, `EditPhoto`) |
| Canvas-form-edit | pages | Ruta | `/canvas-form-edit` | Alta | Sí | Igual que canvas-form |
| Change-password | pages | Ruta | `/change-password` | Simple | Sí | — |
| Create-effectiveness | pages | Ruta | `/create-effectiveness` | Media | No | **Camera**, modal `EditPhoto` |
| Edit-photo | pages | Modal | Presentado desde canvas-form, canvas-form-edit, table-detail, tracing, pamolsa-action-form-detail, create-effectiveness, form-rest | Simple | Sí | [PENDIENTE] revisar si solo recorta UI sin cámara directa |
| Effectiveness (raíz) | pages | Ruta | `/effectiveness` y `tabs/effectiveness` | Media | Sí | — |
| Formats | pages | [PENDIENTE] Sin ruta activa | — | Simple | Sí | — |
| Formats-scan | pages | [PENDIENTE] Sin ruta activa | — | Simple | Sí | — |
| Learning: achievement | pages | Ruta | `/achievement` | Media | Sí | `window.open` (certificado) |
| Learning: courses | pages | Ruta | `/courses` | Media | Sí | — |
| Learning: detail | pages | Ruta | `/detail` | Media | Sí | `window.open`; FileTransfer/File/HTTP **comentados** |
| Learning: exam | pages | Ruta | `/exam` | Media | Sí | — |
| Learning: lesson | pages | Ruta | `/lesson` | Media | Sí | — |
| Learning: menu | pages | Ruta | `/learning-menu` | Simple | Sí | — |
| Learning: pre-exam | pages | Ruta | `/pre-exam` | Media | Sí | — |
| Learning: survey | pages | Ruta | `/survey` | Media | Sí | — |
| List-pending (raíz) | pages | Ruta | `/list-pending` y `tabs/list-pending` | Simple | Sí | — |
| List-records | pages | Tab hijo | `/tabs/list-records` | Media | Sí | — |
| Login | pages | Ruta | `/login` | Simple | Sí | — |
| Medical: form-rest | pages | Ruta | `/form-rest` | Alta | Sí | **Camera**, modales (`EditPhoto`) |
| Medical: list-rest | pages | Ruta | `/list-rest` | Media | Sí | — |
| Medical: menu | pages | Ruta | `/medical-menu` | Media | Sí | **InAppBrowser** |
| Pamolsa-action-form | pages | Ruta | `/pamolsa-action-form` | Alta | Sí | declara `PamolsaActionFormDetail` en módulo |
| Pamolsa-action-form-detail | pages | Modal / entryComponent | Sin ruta propia; usado dentro de `pamolsa-action-form` | Alta | Sí | **Camera**, `EditPhoto` |
| Pre-main | pages | Ruta | `/pre-main` (`AuthGuard`) | Simple | Sí | — |
| Profile | pages | Tab hijo | `/tabs/profile` | Media | Sí | — |
| Record | pages | [PENDIENTE] Sin ruta activa en `app-routing` | — | Media | Sí | **Camera**, **SignaturePad** |
| Recover-password | pages | Ruta | `/recover-password` | Simple | Sí | — |
| Scan | pages | [PENDIENTE] Sin ruta activa | — | Media | Sí | **Camera** |
| Specials-forms | pages | Ruta | `/specials-forms` | Simple | Sí | — |
| Splash | pages | Ruta | `/splash` | Simple | Sí | — |
| Table-detail | pages | Modal embebido | Importado en canvas-form / canvas-form-edit | Alta | Sí | **Camera**, `ionic-selectable`, `EditPhoto` |
| Tabs | pages | Ruta padre | `/tabs` → redirige a `canvas` | Media | Sí | — |
| Tracing | pages | Modal | Desde `action-detail` (sin ruta raíz activa) | Alta | Sí | **Camera**, **AndroidPermissions** (flujo alternativo comentado), `EditPhoto` |
| Card | components | Componente | Reutilizable (importado en módulos) | Simple | Sí | — |
| Header | components | Componente | Reutilizable | Simple | Sí | — |
| New-card | components | Componente | Reutilizable | Simple | Sí | — |
| Virtual-select | components | Componente | Reutilizable | Media | No (sin `.scss`) | — |

**Notas:**

- Total **46** archivos `*.page.ts` y **4** componentes bajo `components/` → **50** filas.
- Páginas con **sin ruta en `app-routing.module.ts` activa** quedan marcadas; pueden seguir alcanzándose por tabs, carga diferida comentada o quedar muertas — conviene validar en runtime.
- `app.scss` no define paleta `--ion-color-*`; el tema Ionic por defecto y color custom `abcd` están en `src/theme/variables.scss` (ver sección 4).

---

## 2. Servicios (`src/app/services/`)

Solo servicios **inyectados al menos en una página** (constructores `*.page.ts`).

| Nombre | Métodos clave (resumen) | Dependencias |
|--------|-------------------------|--------------|
| **AlertCtrlService** | `present(title, msg)` | `AlertController` (Ionic) |
| **EnterpriseService** | `getInitInfo`, `sendImageWatcher`, `saveReport`, `getRankings`, `checkAnswer`, `getQuestions`, … | `HttpClient`, `AlertCtrlService` |
| **FormService** | `getGeneralInfo`, `list`, `getListRecords`, `saveData`, `saveDataPamolsaAction`, `saveDataPamolsaTracing`, `saveDataPamolsaEffectiveness`, `loadStorage` / `saveStorage` | `QueryService`, `Platform`, **Ionic Storage** (`@ionic/storage`) |
| **LearningService** | `getCourses`, `getCourseDetail`, `getAchievements`, `registerExam`, `registerSurvey`, `updateVideoAttempt`, setters/getters de estado de lección/examen | `QueryService` |
| **LoadingService** | `present`, `dismiss` | `LoadingController` |
| **LocationService** | `initWatch` → **Geolocation** `getCurrentPosition`, publica `Events` | `Geolocation`, `Events` |
| **MedicalService** | `registerRestMedical`, `getRestMedical`, `getInfoUser`, `setRecords` / `getRecords` | `QueryService` |
| **QueryService** | `executeQuery`, `executeQueryLearning`, `executeQueryMedical`, `manageErrors` | `HttpClient`, `AlertCtrlService` |
| **UserService** | `login`, `recoverPassword`, `changePassword`, `logout`, `checkUser`, `profileSection`, `loadStorage` / `saveStorage`, `clearAll` | `Platform`, **Ionic Storage**, `HttpClient`, `QueryService`, `AlertCtrlService`, `NavController` |

**Observación:** No hay servicio de `src/app/services/` sin uso en páginas; los nueve aparecen en al menos una pantalla.

---

## 3. Plugins y APIs nativas (invocaciones reales en código)

| API / patrón | Ubicación / uso |
|--------------|-----------------|
| **Camera** `getPicture` | `canvas-form.page.ts`, `canvas-form-edit.page.ts`, `tracing.page.ts`, `pamolsa-action-form-detail.page.ts`, `form-rest.page.ts`, `create-effectiveness.page.ts`, `table-detail.page.ts`, `scan.page.ts`, `record.page.ts` |
| **Geolocation** `getCurrentPosition` | `location.service.ts` → usado desde `canvas-form` y `canvas-form-edit` (`initWatch`) |
| **InAppBrowser** `create` | `canvas.page.ts` (`goWeb`), `medical/menu/menu.page.ts` (`goWeb`) |
| **SplashScreen** / **StatusBar** | `app.component.ts` |
| **AndroidPermissions** `checkPermission` / `requestPermission` | `tracing.page.ts` — código de uso **comentado**; la clase sigue inyectada |
| **cordova.plugins.permissions** | `app.component.ts` — bloque Android **comentado** en `initializeApp`; métodos auxiliares presentes |
| **Ionic Storage** `get` / `set` / `clear` / `ready` | `form.service.ts`, `user.service.ts` (rama `cordova`) |
| **localStorage** `getItem` / `setItem` / `clear` | Misma lógica en rama no Cordova en `form.service` y `user.service` |
| **HTTP** (Angular) | `query.service`, `user.service`, `enterprise.service` — no se encontró uso activo de `@ionic-native/http` en `src` |
| **File** / **FileTransfer** / **upload** | Solo imports **comentados** en `learning/detail/detail.page.ts` |
| **SignaturePad** | `record.page.ts` (`angular2-signaturepad`) |
| **ionic-selectable** | Plantillas en `canvas-form`, `table-detail` (no es plugin Cordova; es dependencia Angular) |

**Dependencias npm relevantes (Cordova / forks):** ver sección 5.

---

## 4. Configuración

### 4.1 `app.scss` (`src/app/app.scss`)

- **No contiene** variables `--ion-color-*` (paleta Ionic por defecto y color custom están en `src/theme/variables.scss`).
- **Variables y tokens usados aquí (extracto conceptual):**  
  - Breakpoint Sass: `$md: 1024px`.  
  - Muchas variables CSS de componentes Ionic: `--background`, `--border-color`, `--padding-*`, `--inner-padding-end`, `--min-height`, `--color-checked`, sombras y colores de botones (`--box-shadow`, `--border-color`), etc.  
  - Colores en hex recurrentes: `#009FE3`, `#98C21D`, `#005286`, `#1B1B1E`, `#F3F3F3`, `#e14d47`, `#ecc547`, `#96b825`, `#707070`, `#838383`, `#727272`, `#1564ad`, `#008DC9`, entre otros.  
- Estilos globales para formularios: clases `.content_form`, `.forms_container`, `.item_html`, segmentos, tablas, footers `.footer_form`.

### 4.2 `environment.ts` / `environment.prod.ts`

| Variable | `environment.ts` (dev) | `environment.prod.ts` (prod) |
|----------|-------------------------|------------------------------|
| `api_url` | `https://tekobu.com/api` | `https://pimpeoforms.com/api` |
| `api_url_learning` | `https://learning.tekobu.com/api` | `https://pimpeoforms.com/learning_web/public/api` |
| `api_url_medical` | `https://medical.tekobu.com/api` | `https://pimpeoforms.com/medical_web/public/api` |

Ambos archivos incluyen URLs alternativas comentadas (localhost, IPs, otros hosts).

### 4.3 `app-routing.module.ts` — estructura

- **`''` → `pre-main`** (con `AuthGuard`).
- Rutas de autenticación: `login`, `recover-password`, `change-password`, `splash`.
- **Tabs:** `tabs` (hijos definidos en `tabs.module.ts`: `canvas`, `effectiveness`, `list-records`, `actions`, `profile`, `list-pending`).
- **Formularios Pamolsa / canvas:** `canvas-form`, `canvas-form-edit`, `pamolsa-action-form`, `actions`, `action-detail`, `effectiveness`, `create-effectiveness`, `list-pending`, `specials-forms`.
- **Learning:** `learning-menu`, `courses`, `detail`, `lesson`, `exam`, `pre-exam`, `survey`, `achievement`.
- **Medical:** `medical-menu`, `list-rest`, `form-rest`.
- **Application-form (prefijo `form-`):** `form-menu`, `form-formats`, `form-records`, `form-list-pending`, `form-effectiveness`, `form-actions`, `form-list-pamolsa`.
- **Comentadas / legacy:** muchas rutas antiguas (`record`, `profile` sueltas, `tracing`, `filter-form`, `edit-photo`, rankings, etc.).

**Hijos de `tabs`:** ver `src/app/pages/tabs/tabs.module.ts`: `''` redirige a `canvas`; hijos `canvas`, `effectiveness`, `list-records`, `actions`, `profile`, `list-pending`.

---

## 5. Riesgos y pendientes

| Marca | Descripción |
|-------|-------------|
| **[RIESGO]** | **Forks de plugins Cordova en `package.json`:** `cordova-plugin-camera` → `github:jalios/cordova-plugin-camera`; `cordova-plugin-file-transfer` → `github:apache/cordova-plugin-file-transfer`. Migración a Expo requerirá reemplazos equivalentes (`expo-camera`, `expo-file-system`, subida con `fetch`, etc.), no reutilización directa. |
| **[RIESGO]** | **Stack antiguo:** Angular 7, Ionic 4, RxJS 6 — mucho código imperativo en páginas, `Events` de Ionic, y módulos con `entryComponents` (patrón pre-Ivy). Coste de porte a React/Expo elevado en pantallas “Alta”. |
| **[RIESGO]** | **Formularios dinámicos** (`canvas-form`, `table-detail`, `pamolsa-action-form`): HTML generado, muchos modales y dependencias (`ionic-selectable`, firmas, fotos). Rehacer en React implica diseño de estado y rendimiento cuidadoso. |
| **[PENDIENTE]** | **InAppBrowser:** uso de `create(url, '_blank')` sin `executeScript` / inyección JS detectada en el código auditado. Revisar si URLs externas requieren cookies o SSO (impacto en `WebBrowser` de Expo). |
| **[PENDIENTE]** | **WebView con JS injection:** no se encontraron llamadas a `executeScript` / `injectJavaScript` en `src`. Si existiera comportamiento dinámico cargado en remoto, validar en pruebas manuales. |
| **[PENDIENTE]** | **Pipes / directivas Angular personalizadas:** no hay `@Pipe` ni `@Directive` propios en `src/app`; solo APIs estándar de Angular/Ionic en plantillas. |
| **[PENDIENTE]** | Páginas sin ruta activa en el enrutador principal: confirmar si siguen en uso (build interno, deep links, o código muerto). |

---

*Documento generado por auditoría estática del repositorio Ionic indicado.*
