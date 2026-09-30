import { UserData, SubjectProgress, QuestionProgress, ExamResult, AppSettings } from '@/types';

const STORAGE_KEY = 'quiz-app-data';
const DATA_VERSION = 1;

function defaultUserData(): UserData {
  return { settings: { theme: 'system' }, progress: {}, version: DATA_VERSION };
}

function defaultSubjectProgress(subjectId: string): SubjectProgress {
  return { subjectId, questionProgress: {}, examHistory: [], lastUpdated: new Date().toISOString() };
}

function defaultQuestionProgress(questionId: number): QuestionProgress {
  return { questionId, correctCount: 0, wrongCount: 0, correctStreak: 0, lastReviewed: null, bookmarked: false, mastered: false };
}

export function loadUserData(): UserData {
  if (typeof window === 'undefined') return defaultUserData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultUserData();
    const data = JSON.parse(raw) as UserData;
    if (!data.version || !data.progress) return defaultUserData();
    return data;
  } catch { return defaultUserData(); }
}

export function saveUserData(data: UserData): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error('Save failed:', e); }
}

export function getSubjectProgress(data: UserData, subjectId: string): SubjectProgress {
  return data.progress[subjectId] || defaultSubjectProgress(subjectId);
}

export function getQuestionProgress(sp: SubjectProgress, questionId: number): QuestionProgress {
  return sp.questionProgress[questionId] || defaultQuestionProgress(questionId);
}

export function recordAnswer(data: UserData, subjectId: string, questionId: number, isCorrect: boolean): UserData {
  const nd = { ...data, progress: { ...data.progress } };
  const sp = { ...getSubjectProgress(nd, subjectId), questionProgress: { ...getSubjectProgress(nd, subjectId).questionProgress } };
  const qp = { ...getQuestionProgress(sp, questionId) };
  if (isCorrect) { qp.correctCount++; qp.correctStreak++; } else { qp.wrongCount++; qp.correctStreak = 0; }
  qp.lastReviewed = new Date().toISOString();
  sp.questionProgress[questionId] = qp;
  sp.lastUpdated = new Date().toISOString();
  nd.progress[subjectId] = sp;
  saveUserData(nd);
  return nd;
}

export function toggleBookmark(data: UserData, subjectId: string, questionId: number): UserData {
  const nd = { ...data, progress: { ...data.progress } };
  const sp = { ...getSubjectProgress(nd, subjectId), questionProgress: { ...getSubjectProgress(nd, subjectId).questionProgress } };
  const qp = { ...getQuestionProgress(sp, questionId) };
  qp.bookmarked = !qp.bookmarked;
  sp.questionProgress[questionId] = qp;
  sp.lastUpdated = new Date().toISOString();
  nd.progress[subjectId] = sp;
  saveUserData(nd);
  return nd;
}

export function toggleMastered(data: UserData, subjectId: string, questionId: number): UserData {
  const nd = { ...data, progress: { ...data.progress } };
  const sp = { ...getSubjectProgress(nd, subjectId), questionProgress: { ...getSubjectProgress(nd, subjectId).questionProgress } };
  const qp = { ...getQuestionProgress(sp, questionId) };
  qp.mastered = !qp.mastered;
  sp.questionProgress[questionId] = qp;
  sp.lastUpdated = new Date().toISOString();
  nd.progress[subjectId] = sp;
  saveUserData(nd);
  return nd;
}

export function saveExamResult(data: UserData, result: ExamResult): UserData {
  const nd = { ...data, progress: { ...data.progress } };
  const sp = { ...getSubjectProgress(nd, result.subjectId) };
  sp.examHistory = [...sp.examHistory, result];
  sp.lastUpdated = new Date().toISOString();
  nd.progress[result.subjectId] = sp;
  saveUserData(nd);
  return nd;
}

export function updateSettings(data: UserData, settings: Partial<AppSettings>): UserData {
  const nd = { ...data, settings: { ...data.settings, ...settings } };
  saveUserData(nd);
  return nd;
}

export function resetAllData(): UserData {
  const nd = defaultUserData();
  saveUserData(nd);
  return nd;
}

export function resetSubjectData(data: UserData, subjectId: string): UserData {
  const nd = { ...data, progress: { ...data.progress } };
  delete nd.progress[subjectId];
  saveUserData(nd);
  return nd;
}

export function exportProgress(data: UserData): string {
  return JSON.stringify(data, null, 2);
}

export function importProgress(json: string): UserData | null {
  try {
    const data = JSON.parse(json) as UserData;
    if (!data.settings || !data.progress || typeof data.version !== 'number') return null;
    saveUserData(data);
    return data;
  } catch { return null; }
}

export function getSubjectStats(data: UserData, subjectId: string, totalQuestions: number) {
  const sp = getSubjectProgress(data, subjectId);
  const entries = Object.values(sp.questionProgress);
  const answered = entries.filter(q => q.correctCount > 0 || q.wrongCount > 0).length;
  const totalCorrect = entries.reduce((s, q) => s + q.correctCount, 0);
  const totalWrong = entries.reduce((s, q) => s + q.wrongCount, 0);
  const totalAttempts = totalCorrect + totalWrong;
  return {
    totalQuestions, answered, unanswered: totalQuestions - answered,
    mastered: entries.filter(q => q.mastered).length,
    bookmarked: entries.filter(q => q.bookmarked).length,
    needsReview: entries.filter(q => q.wrongCount > 0 && !q.mastered).length,
    accuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
    progressPercent: totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0,
    totalCorrect, totalWrong,
  };
}

export function getSmartReviewScore(qp: QuestionProgress): number {
  let score = 0;
  score += qp.wrongCount * 10;
  if (qp.correctStreak === 0) score += 15;
  else if (qp.correctStreak === 1) score += 8;
  else if (qp.correctStreak === 2) score += 4;
  if (qp.correctCount === 0 && qp.wrongCount === 0) score += 12;
  if (qp.lastReviewed) {
    const days = (Date.now() - new Date(qp.lastReviewed).getTime()) / 86400000;
    score += Math.min(days * 2, 20);
  } else score += 10;
  if (qp.bookmarked) score += 5;
  if (qp.mastered) score -= 50;
  return score;
}
