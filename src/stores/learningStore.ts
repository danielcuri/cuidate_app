import { create } from 'zustand';
import type { Course, Exam, Lesson, Questions } from '../interfaces/learning';

export type LearningStoreState = {
  courses: Course[];
  currentCourseId?: number;
  currentCourse?: Course;
  currentLesson?: Lesson;
  currentExam?: Exam;
  currentQuestions: Questions[];
  setCourses: (courses: Course[]) => void;
  setCurrentCourse: (course?: Course) => void;
  setCurrentCourseId: (courseId?: number) => void;
  setCurrentLesson: (lesson?: Lesson) => void;
  setCurrentExam: (exam?: Exam) => void;
  setCurrentQuestions: (questions: Questions[]) => void;
  resetLearningContext: () => void;
};

export const useLearningStore = create<LearningStoreState>((set) => ({
  courses: [],
  currentCourseId: undefined,
  currentCourse: undefined,
  currentLesson: undefined,
  currentExam: undefined,
  currentQuestions: [],

  setCourses: (courses) => set({ courses }),
  setCurrentCourse: (course) => set({ currentCourse: course }),
  setCurrentCourseId: (courseId) => set({ currentCourseId: courseId }),
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  setCurrentExam: (exam) => set({ currentExam: exam }),
  setCurrentQuestions: (questions) => set({ currentQuestions: questions }),
  resetLearningContext: () =>
    set({
      currentCourseId: undefined,
      currentCourse: undefined,
      currentLesson: undefined,
      currentExam: undefined,
      currentQuestions: [],
    }),
}));

