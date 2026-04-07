import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Auxiliar, CoursesAnswer, ExamAnswer, GeneralAnswer } from '../interfaces/learning';
import { queryService } from './QueryService';

const VIDEO_TIMES_KEY = 'learning_video_times';

export type GetCoursesPayload = { dni: string };
export type GetCourseDetailPayload = { dni: string; course_id: number };
export type GetExamDetailPayload = { dni: string; exam_id: number };
export type UpdateVideoAttemptPayload = { dni: string; lesson_id: number };
export type SubmitExamPayload = {
  dni: string;
  exam_id: number;
  answers: unknown;
  exam_start_time?: string;
  exam_finish_time?: string;
};
export type SubmitSurveyPayload = {
  dni: string;
  course_id: number;
  answers: unknown;
  comment?: string;
};
export type GetAchievementsPayload = { dni: string };

/**
 * Paridad con Ionic `LearningService`.
 * Nota: Los paths pueden ajustarse si backend usa otros nombres.
 */
export class LearningService {
  private dataLesson: unknown;
  private dataExam: unknown;
  private dataQuestion: unknown;
  private courseId?: number;

  async getCourses(data: GetCoursesPayload): Promise<CoursesAnswer> {
    // Backend learning expone rutas tipo Laravel: POST /getCourses
    return queryService.executeQueryLearning<CoursesAnswer>('post', '/getCourses', data);
  }

  async getCourseDetail(data: GetCourseDetailPayload): Promise<CoursesAnswer> {
    // En backend real: POST /getCourse
    return queryService.executeQueryLearning<CoursesAnswer>('post', '/getCourse', data);
  }

  async getExamDetail(data: GetExamDetailPayload): Promise<ExamAnswer> {
    return queryService.executeQueryLearning<ExamAnswer>('post', '/getExamDetail', data);
  }

  async updateVideoAttempt(data: UpdateVideoAttemptPayload): Promise<GeneralAnswer> {
    return queryService.executeQueryLearning<GeneralAnswer>('post', '/lesson-attempt', data);
  }

  async registerExam(data: SubmitExamPayload): Promise<GeneralAnswer> {
    return queryService.executeQueryLearning<GeneralAnswer>('post', '/exam-submit', data);
  }

  async registerSurvey(data: SubmitSurveyPayload): Promise<GeneralAnswer> {
    return queryService.executeQueryLearning<GeneralAnswer>('post', '/survey-submit', data);
  }

  async getAchievements(data: GetAchievementsPayload): Promise<CoursesAnswer> {
    // En backend real: POST /getCertificates
    return queryService.executeQueryLearning<CoursesAnswer>('post', '/getCertificates', data);
  }

  updateExamAttempt(_data: unknown): void {
    // Endpoint legacy en Ionic; si backend expone otro recurso, se puede mapear aquí.
  }

  setDataLesson(data: unknown): void {
    this.dataLesson = data;
  }
  getDataLesson<T = unknown>(): T | undefined {
    return this.dataLesson as T | undefined;
  }

  setDataExam(data: unknown): void {
    this.dataExam = data;
  }
  getDataExam<T = unknown>(): T | undefined {
    return this.dataExam as T | undefined;
  }

  setDataQuestion(data: unknown): void {
    this.dataQuestion = data;
  }
  getDataQuestion<T = unknown>(): T | undefined {
    return this.dataQuestion as T | undefined;
  }

  setCourseId(id: number): void {
    this.courseId = id;
  }
  getCourseId(): number | undefined {
    return this.courseId;
  }

  async setTimeVideo(time: number, video: string, user: number, lesson: number): Promise<void> {
    const all = await this.getTimeVideo();
    const next: Auxiliar[] = Array.isArray(all) ? [...all] : [];
    const idx = next.findIndex((x) => x.user === user && x.lesson === lesson && x.video === video);
    const item: Auxiliar = { user, lesson, video, time };
    if (idx >= 0) {
      next[idx] = item;
    } else {
      next.push(item);
    }
    await AsyncStorage.setItem(VIDEO_TIMES_KEY, JSON.stringify(next));
  }

  async getTimeVideo(): Promise<Auxiliar[]> {
    const raw = await AsyncStorage.getItem(VIDEO_TIMES_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Auxiliar[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export const learningService = new LearningService();
