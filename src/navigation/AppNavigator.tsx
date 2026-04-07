import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { PreMain } from '@/screens/main/PreMain';
import { FormMenu } from '@/screens/form/FormMenu';
import { CanvasForm } from '@/screens/form/CanvasForm';
import { Effectiveness } from '@/screens/form/Effectiveness';
import { Actions } from '@/screens/form/Actions';
import { ListPending } from '@/screens/form/ListPending';
import { Formats } from '@/screens/form/Formats';
import { Records } from '@/screens/form/Records';
import { ListPamolsa } from '@/screens/form/ListPamolsa';
import { ActionDetail } from '@/screens/form/ActionDetail';
import { CreateEffectiveness } from '@/screens/form/CreateEffectiveness';
import { PamolsaActionForm } from '@/screens/form/pamolsa/PamolsaActionForm';
import { PamolsaActionFormDetail } from '@/screens/form/pamolsa/PamolsaActionFormDetail';
import { MedicalMenu } from '@/screens/medical/MedicalMenu';
import { FormRest } from '@/screens/medical/FormRest';
import { ListRest } from '@/screens/medical/ListRest';
import { LearningMenu } from '@/screens/learning/LearningMenu';
import { Courses } from '@/screens/learning/Courses';
import { Achievement } from '@/screens/learning/Achievement';
import { Exam } from '@/screens/learning/Exam';
import { CourseDetail } from '@/screens/learning/CourseDetail';
import { Lesson } from '@/screens/learning/Lesson';
import { PreExam } from '@/screens/learning/PreExam';
import { Survey } from '@/screens/learning/Survey';
import { COLORS } from '@/theme/colors';

export type RootStackParamList = {
  Auth: undefined;
  PreMain: undefined;
  FormMenu: undefined;
  /** Nuevo registro o vista (sin borrador local). Opcional `formRecordId` cuando exista API de detalle. */
  CanvasForm: { formId?: number; formRecordId?: number };
  /** Edición de borrador local (paridad `canvas-form-edit`). */
  CanvasFormEdit: { formId: number; index: number };
  Effectiveness: undefined;
  Actions: undefined;
  ListPending: undefined;
  Formats: undefined;
  PamolsaActionForm: undefined;
  PamolsaActionFormDetail: { actionId: number };
  Records: undefined;
  ListPamolsa: { active_action?: number } | undefined;
  ActionDetail: { actionId: number };
  CreateEffectiveness: {
    pamolsaActionDetailId: number;
    effectiveDate: string;
  };
  MedicalMenu: undefined;
  FormRest: undefined;
  ListRest: undefined;
  LearningMenu: undefined;
  Courses: undefined;
  CourseDetail: { courseId: number; name: string };
  Lesson: { courseId: number; name: string; lessonId: number };
  PreExam: { courseId: number; name: string; examId: number };
  Achievement: undefined;
  Exam: { courseId: number; name: string; examId: number };
  Survey: { courseId: number; name: string };
};

const Root = createStackNavigator<RootStackParamList>();

const headerOpts = {
  headerShown: true as const,
  headerTintColor: COLORS.text,
  headerBackTitle: 'Atrás',
};

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Root.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
          <Root.Screen name="Auth" component={AuthNavigator} />
          <Root.Screen name="PreMain" component={PreMain} />
          <Root.Screen name="FormMenu" component={FormMenu} />
          <Root.Screen
            name="CanvasForm"
            component={CanvasForm}
            options={{ ...headerOpts, title: 'Formularios Canvas' }}
          />
          <Root.Screen
            name="CanvasFormEdit"
            component={CanvasForm}
            options={{ ...headerOpts, title: 'Editar borrador' }}
          />
          <Root.Screen
            name="ActionDetail"
            component={ActionDetail}
            options={{ ...headerOpts, title: 'Detalle acción' }}
          />
          <Root.Screen
            name="CreateEffectiveness"
            component={CreateEffectiveness}
            options={{ ...headerOpts, title: 'Eficacia' }}
          />
          <Root.Screen
            name="Effectiveness"
            component={Effectiveness}
            options={{ ...headerOpts, title: 'Efectividad' }}
          />
          <Root.Screen
            name="Actions"
            component={Actions}
            options={{ ...headerOpts, title: 'Acciones Pamolsa' }}
          />
          <Root.Screen
            name="ListPending"
            component={ListPending}
            options={{ ...headerOpts, title: 'Pendientes' }}
          />
          <Root.Screen
            name="Formats"
            component={Formats}
            options={{ ...headerOpts, title: 'Formatos' }}
          />
          <Root.Screen
            name="PamolsaActionForm"
            component={PamolsaActionForm}
            options={{ ...headerOpts, title: 'Hallazgo SST' }}
          />
          <Root.Screen
            name="PamolsaActionFormDetail"
            component={PamolsaActionFormDetail}
            options={{ ...headerOpts, title: 'Detalle hallazgo' }}
          />
          <Root.Screen
            name="Records"
            component={Records}
            options={{ ...headerOpts, title: 'Registros' }}
          />
          <Root.Screen
            name="ListPamolsa"
            component={ListPamolsa}
            options={{ ...headerOpts, title: 'Inspecciones SST' }}
          />
          <Root.Screen name="MedicalMenu" component={MedicalMenu} />
          <Root.Screen
            name="FormRest"
            component={FormRest}
            options={{ headerShown: false }}
          />
          <Root.Screen
            name="ListRest"
            component={ListRest}
            options={{ headerShown: false }}
          />
          <Root.Screen name="LearningMenu" component={LearningMenu} />
          <Root.Screen
            name="Courses"
            component={Courses}
            options={{ ...headerOpts, title: 'Capacitaciones' }}
          />
          <Root.Screen
            name="CourseDetail"
            component={CourseDetail}
            options={{ ...headerOpts, title: 'Detalle curso' }}
          />
          <Root.Screen
            name="Lesson"
            component={Lesson}
            options={{ ...headerOpts, title: 'Lección' }}
          />
          <Root.Screen
            name="PreExam"
            component={PreExam}
            options={{ ...headerOpts, title: 'Pre-examen' }}
          />
          <Root.Screen
            name="Achievement"
            component={Achievement}
            options={{ ...headerOpts, title: 'Logros' }}
          />
          <Root.Screen
            name="Exam"
            component={Exam}
            options={{ ...headerOpts, title: 'Exámenes' }}
          />
          <Root.Screen
            name="Survey"
            component={Survey}
            options={{ ...headerOpts, title: 'Encuesta' }}
          />
        </Root.Navigator>
    </NavigationContainer>
  );
}
