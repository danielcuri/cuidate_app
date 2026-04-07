# Migración: Flujo Learning (Capacitaciones)

---

**Origen:** `E:\ionic_projects\pamolsa-app`

## 1. Árbol de pantallas (Ionic)

```
/learning-menu          → pages/learning/menu/          (MenuPage)
  ├── /courses          → pages/learning/courses/        (CoursesPage)
  │     └── /detail     { name }                         (DetailPage)
  │           ├── /lesson   { name }                     (LessonPage)     ← video Vimeo
  │           ├── /pre-exam { name }                     (PreExamPage)
  │           │     └── /exam { name }                   (ExamPage)       ← examen cronometrado
  │           └── /survey   { name }                     (SurveyPage)     ← encuesta satisfacción
  └── /achievement       → pages/learning/achievement/   (AchievementPage) ← certificados
```

---

## 2. Árbol de pantallas propuesto (React Native Expo)

```
LearningMenuScreen        (Stack.Screen - entrada al flujo)
  ├── CoursesScreen       (lista de capacitaciones matriculadas)
  │     └── CourseDetailScreen  { name }
  │           ├── LessonScreen   { name }    ← video Vimeo via WebView
  │           ├── PreExamScreen  { name }
  │           │     └── ExamScreen  { name } ← timer con BehaviorSubject → useRef interval
  │           └── SurveyScreen   { name }
  └── AchievementScreen   (certificados descargables)
```

---

## 3. Tabla de equivalencias de componentes

| Ionic                                       | React Native Expo                                 | Notas                                                                                   |
| ------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `ion-header` / `ion-toolbar`                | Custom `Header` component                         | Logos + barra tricolor (igual que otros flujos)                                         |
| `ion-card`                                  | Custom `CourseCard` component                     | Props: image, name, area, dateEnd, status                                               |
| `ion-card-header/content`                   | `View` con estilos                                |                                                                                         |
| `ion-button color="warning/success/danger"` | `TouchableOpacity` con color condicional          | Estados: Pendiente/Aprobado/Desaprobado/Vencido                                         |
| `ion-list` / `ion-item`                     | `FlatList` o `ScrollView` con `View`              |                                                                                         |
| `ion-avatar` (íconos lock/check)            | `@expo/vector-icons` Ionicons                     | `ios-lock` → `lock-closed`, `ios-checkmark-circle-outline` → `checkmark-circle-outline` |
| `ion-radio-group` / `ion-radio`             | Custom `RadioGroup` component                     | No hay radio nativo en RN, implementar con state                                        |
| `ion-checkbox`                              | `CheckBox` de RN o custom component               |                                                                                         |
| `ion-textarea`                              | `TextInput multiline`                             |                                                                                         |
| `ion-fab` / `ion-fab-button`                | `View` posición absoluta abajo-derecha            | Muestra el temporizador del examen                                                      |
| `[innerHTML]`                               | `react-native-webview` o librería de HTML parsing | Preguntas del examen vienen con HTML                                                    |
| `@vimeo/player`                             | `react-native-webview` con Vimeo embed URL        | Ver sección de riesgos                                                                  |
| `window.open(url, '_blank')`                | `expo-web-browser` (`openBrowserAsync`)           | Para materiales de clase y certificados                                                 |
| `ion-footer`                                | `View` fijo abajo + `SafeAreaView`                |                                                                                         |
| `Platform.width()`                          | `useWindowDimensions().width`                     |                                                                                         |
| `BehaviorSubject` (RxJS timer)              | `useRef` + `setInterval` + `useState`             | Temporizador del examen                                                                 |
| `moment-timezone`                           | `moment-timezone` (ya en package.json)            |                                                                                         |

---

## 4. Navegación

**Ionic (Router Angular):**

- Rutas planas globales con parámetros como matrix params: `{ name: item.name }`
- El `course_id` no se pasa por ruta — se guarda en el servicio (`LearningService.setCourseId()`)

**React Native Expo (React Navigation v6+):**

```typescript
const LearningStack = createStackNavigator();

export function LearningNavigator() {
  return (
    <LearningStack.Navigator>
      <LearningStack.Screen name="LearningMenu"    component={LearningMenuScreen} />
      <LearningStack.Screen name="Courses"         component={CoursesScreen} />
      <LearningStack.Screen name="CourseDetail"    component={CourseDetailScreen} />
      <LearningStack.Screen name="Lesson"          component={LessonScreen} />
      <LearningStack.Screen name="PreExam"         component={PreExamScreen} />
      <LearningStack.Screen name="Exam"            component={ExamScreen} />
      <LearningStack.Screen name="Survey"          component={SurveyScreen} />
      <LearningStack.Screen name="Achievement"     component={AchievementScreen} />
    </LearningStack.Navigator>
  );
}
```

**Reemplazo del patrón `setCourseId` / `getCourseId`:**

En Ionic el `course_id` y la data del examen/lección se guardan en el servicio como estado en memoria. En React Native se pasan directamente por params o se usan en el store:

```typescript
// Opción A: Pasar por params (recomendado para datos simples)
navigation.navigate("CourseDetail", {
    courseId: item.course_id,
    name: item.name,
});

// Opción B: Store Zustand para data compleja (lesson, exam)
useLearningStore.getState().setCurrentLesson(lesson);
navigation.navigate("Lesson", { name });
```

---

## 5. Estado y lógica de negocio

### CoursesScreen

- Carga la lista de cursos matriculados del usuario vía DNI.
- Muestra estado del curso: `0=Pendiente`, `1=Aprobado`, `2=Desaprobado`, `3=Vencido`.
- Al tocar un curso, guarda `course_id` y navega a `CourseDetail`.

### CourseDetailScreen

- Recibe el `course_id` y el `name` del curso.
- Carga el detalle del curso: `course`, `lessons`, `exams`, `materials`, `new_format` (estructura compleja con secciones y sub-ítems).
- Muestra:
    - Metadata (área, fecha límite, duraciones)
    - Secciones con lecciones y exámenes (estructura `SpecialFormat → Complex[]`)
    - Materiales de clase (se abren en browser externo)
    - Encuesta de satisfacción (bloqueada si `flag_survery === 1`)
- Íconos por ítem: `lock-closed` (bloqueado, `icon === 2`) o `checkmark-circle` (disponible, `icon === 1`)
- `register_type === 1` → es lección, `register_type === 2` → es examen

### LessonScreen

- Carga el video de Vimeo usando `WebView` con la URL embebida.
- **Lógica crítica de control de tiempo:**
    - Guarda el tiempo de reproducción en `AsyncStorage` cada 10 segundos.
    - Al reabrir, retoma desde donde se quedó.
    - El usuario **no puede adelantar** el video (se bloquea el seek hacia adelante).
    - Al completar el video, llama a `updateVideoAttempt` (marca la lección como vista).
- El botón "Retroceder 10 seg" ajusta el tiempo del player.

```typescript
// Simulación del control anti-seek en WebView
// El player Vimeo se embebe y se controla via postMessage / JS injections
const vimeoEmbedUrl = `https://player.vimeo.com/video/${lesson.video_link}?autoplay=0`;
```

### PreExamScreen

- Muestra metadatos del examen: duración, número de intentos, intentos realizados.
- Llama a `getExamDetail` para verificar si el usuario puede rendir el examen (`error: true` → deshabilitado).
- El botón "Iniciar" lleva a `ExamScreen`.

### ExamScreen

- **Temporizador regresivo** (en minutos):

```typescript
// Reemplazar BehaviorSubject por useRef + interval
const [timeDisplay, setTimeDisplay] = useState("00:00");
const intervalRef = useRef<NodeJS.Timeout>();

useEffect(() => {
    const totalSeconds = exam.minutes * 60;
    let remaining = totalSeconds;
    intervalRef.current = setInterval(() => {
        remaining--;
        const m = Math.floor(remaining / 60)
            .toString()
            .padStart(2, "0");
        const s = (remaining % 60).toString().padStart(2, "0");
        setTimeDisplay(`${m}:${s}`);
        if (remaining <= 0) {
            clearInterval(intervalRef.current);
            setFlagOnTime(false);
        }
    }, 1000);
    return () => clearInterval(intervalRef.current);
}, []);
```

- Preguntas tipo radio (`type === 0`) o checkbox (`type === 1`).
- Contenido HTML en preguntas → usar `WebView` o `react-native-render-html` (no incluido aún en package.json).
- Al finalizar, envía respuestas con `exam_start_time` y `exam_finish_time`.

### SurveyScreen

- Escala Likert 1–5 con radio buttons.
- Un campo de texto libre al final (`TextInput multiline`).
- Envío único (sin paginación).

### AchievementScreen

- Lista de certificados aprobados con fecha de finalización.
- Botón "Descargar" → `expo-web-browser` (`openBrowserAsync(item.certificate)`).

**Store Zustand sugerido:**

```typescript
interface LearningStore {
    courses: Course[];
    currentLesson: Lesson | null;
    currentExam: Exam | null;
    currentQuestions: Questions[];
    timeVideoRecords: Auxiliar[]; // guardado en AsyncStorage
    setCourses: (courses: Course[]) => void;
    setCurrentLesson: (lesson: Lesson) => void;
    setCurrentExam: (exam: Exam) => void;
    setTimeVideo: (
        time: number,
        video: string,
        user: number,
        lesson: number,
    ) => void;
    getTimeVideo: () => Auxiliar[];
}
```

---

## 6. Servicios / API

| Método Ionic (`LearningService`)            | Endpoint esperado           | En RN usar     |
| ------------------------------------------- | --------------------------- | -------------- |
| `getCourses({ dni })`                       | GET `/courses?dni=...`      | `axios.get`    |
| `getCourseDetail({ dni, course_id })`       | GET `/course-detail`        | `axios.get`    |
| `getExamDetail({ dni, exam_id })`           | GET `/exam-detail`          | `axios.get`    |
| `updateVideoAttempt({ dni, lesson_id })`    | POST `/lesson-attempt`      | `axios.post`   |
| `submitExam({ dni, exam_id, answers, ...})` | POST `/exam-submit`         | `axios.post`   |
| `submitSurvey({ answers })`                 | POST `/survey-submit`       | `axios.post`   |
| `getAchievements({ dni })`                  | GET `/achievements?dni=...` | `axios.get`    |
| `setTimeVideo / getTimeVideo`               | AsyncStorage local          | `AsyncStorage` |

---

## 7. Consideraciones y riesgos

| #   | Consideración                                                                | Riesgo | Solución                                                                                                                                     |
| --- | ---------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Player Vimeo** (`@vimeo/player`) no existe en React Native                 | Alto   | Usar `react-native-webview` con URL embed de Vimeo. El control de eventos (timeupdate, play, pause) se hace via `postMessage` / JS injection |
| 2   | **Anti-seek** del video (el usuario no puede adelantar)                      | Alto   | Implementar mediante `injectedJavaScript` en WebView para interceptar eventos del player Vimeo                                               |
| 3   | **Guardar tiempo de video** cada 10 seg en local                             | Medio  | `AsyncStorage` con key `video_times`, misma estructura `Auxiliar[]`                                                                          |
| 4   | **Preguntas con HTML** (`[innerHTML]`) en examen                             | Medio  | Agregar `react-native-render-html` al proyecto Expo                                                                                          |
| 5   | **Temporizador del examen** (BehaviorSubject RxJS)                           | Bajo   | `useRef` + `setInterval` con cleanup en `useEffect`                                                                                          |
| 6   | **Estructura de datos compleja** `SpecialFormat → Complex[]` en CourseDetail | Medio  | Mapear secciones con `SectionList` de RN                                                                                                     |
| 7   | **`window.open`** para materiales y certificados                             | Bajo   | `expo-web-browser` (ya en package.json)                                                                                                      |
| 8   | **`location.back()`** en LessonPage                                          | Bajo   | `navigation.goBack()`                                                                                                                        |

---

## 8. Checklist de migración

### LearningMenuScreen

- [ ] Header custom con logos y barra tricolor
- [ ] Grid con 2 opciones: Capacitaciones y Logros (con íconos SVG)
- [ ] Botón "Volver" al pre-main

### CoursesScreen

- [ ] Carga de cursos por DNI al montar (`useFocusEffect`)
- [ ] Loading indicator durante la carga
- [ ] `FlatList` de cursos con `CourseCard`:
    - [ ] Imagen de portada (`list_picture`)
    - [ ] Nombre y área
    - [ ] Fecha límite formateada `dd/MM/yyyy`
    - [ ] Badge de estado (Pendiente/Aprobado/Desaprobado/Vencido)
- [ ] Navegación a `CourseDetail` con `courseId` y `name`

### CourseDetailScreen

- [ ] Metadata: área, fecha límite, duración video, duración examen
- [ ] Descripción larga del curso
- [ ] `SectionList` con secciones de la estructura `SpecialFormat[]`
    - [ ] Ícono lock/check por ítem
    - [ ] Estado de clase o examen por sub-ítem
    - [ ] Tap en ítem disponible → navegar a `Lesson` o `PreExam`
- [ ] Sección "Material de Clase" → abrir en browser externo
- [ ] Sección "Encuesta de Satisfacción" → navegar a `Survey` si desbloqueada
- [ ] Botón "Volver" a `Courses`

### LessonScreen

- [ ] Header con nombre del curso
- [ ] Nombre de la lección y duración del video
- [ ] `WebView` con embed de Vimeo
- [ ] Botón "Retroceder 10 seg"
- [ ] Guardar tiempo de reproducción en `AsyncStorage` cada 10 seg
- [ ] Al reiniciar, retomar desde tiempo guardado
- [ ] Bloqueo de seek hacia adelante vía JS injection
- [ ] Al completar → llamar a `updateVideoAttempt`
- [ ] Botón "Volver"

### PreExamScreen

- [ ] Metadata: duración, intentos totales, intentos realizados
- [ ] Llamada a `getExamDetail` para validar disponibilidad
- [ ] Botón "Iniciar" deshabilitado si `error === true`
- [ ] Guardar `questions` en store antes de navegar a `Exam`
- [ ] Botón "Volver" a `CourseDetail`

### ExamScreen

- [ ] Temporizador regresivo visible (FAB/badge flotante)
- [ ] Lista de preguntas con HTML renderizado
- [ ] Radio buttons para preguntas tipo 0 (simple opción)
- [ ] Checkboxes para preguntas tipo 1 (múltiple opción)
- [ ] Mensaje "Se acabó el tiempo" al vencer el timer
- [ ] Botón "Finalizar" → enviar respuestas con tiempos

### SurveyScreen

- [ ] Escala de valoración 1-5 visible al inicio
- [ ] Lista de preguntas con radio buttons (valores 1–5)
- [ ] Campo de texto libre al final (`TextInput multiline`)
- [ ] Botón "Finalizar" → enviar encuesta

### AchievementScreen

- [ ] Header con título "Listado de Cursos"
- [ ] `FlatList` de certificados con nombre y fecha de finalización
- [ ] Ícono de logro SVG por ítem
- [ ] Botón "Descargar" → `expo-web-browser`
- [ ] Botón "Volver" al `LearningMenu`

### Infraestructura

- [ ] `LearningService` con todos los endpoints
- [ ] Store Zustand con slice Learning
- [ ] Guardar/leer tiempos de video en `AsyncStorage`
- [ ] Agregar `react-native-render-html` si se decide no usar WebView para el HTML de preguntas
