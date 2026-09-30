// Core types for the quiz application

export interface Question {
  id: number;
  question: string;
  options: Record<string, string>;
  answer: string | null;
  needsReview: boolean;
  duplicate?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  examDurationMinutes?: number | null;
  questions: Question[];
}

export interface SubjectMeta {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

export interface QuestionProgress {
  questionId: number;
  correctCount: number;
  wrongCount: number;
  correctStreak: number;
  lastReviewed: string | null;
  bookmarked: boolean;
  mastered: boolean;
}

export interface ExamAnswer {
  questionId: number;
  selectedAnswer: string | null;
}

export interface ExamResult {
  id: string;
  subjectId: string;
  date: string;
  questionIds: number[];
  answers: ExamAnswer[];
  correct: number;
  wrong: number;
  unanswered: number;
  accuracy: number;
  timeSeconds: number;
}

export interface SubjectProgress {
  subjectId: string;
  questionProgress: Record<number, QuestionProgress>;
  examHistory: ExamResult[];
  lastUpdated: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
}

export interface UserData {
  settings: AppSettings;
  progress: Record<string, SubjectProgress>;
  version: number;
}

export type QuizMode = 'practice' | 'exam' | 'review-wrong' | 'review-smart' | 'review-bookmarked';

export interface PracticeConfig {
  questionCount: number | 'all';
  order: 'sequential' | 'random';
  shuffleOptions: boolean;
  onlyUnanswered: boolean;
  onlyWrong: boolean;
}
