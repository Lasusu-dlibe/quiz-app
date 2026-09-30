import { Subject, SubjectMeta } from '@/types';
import khoaHocQuanLyData from '@/data/subjects/khoa-hoc-quan-ly.json';

const subjects: Subject[] = [khoaHocQuanLyData as Subject];

export function getSubjectList(): SubjectMeta[] {
  return subjects.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    questionCount: s.questionCount,
  }));
}

export function getSubject(id: string): Subject | null {
  return subjects.find(s => s.id === id) || null;
}
