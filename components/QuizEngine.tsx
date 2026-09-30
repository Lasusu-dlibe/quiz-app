"use client";
import { useState, useEffect, useCallback } from "react";
import { Question, QuizMode } from "@/types";
import { loadUserData, recordAnswer, toggleBookmark, getSubjectProgress, getQuestionProgress } from "@/lib/storage";

interface Props {
  questions: Question[];
  subjectId: string;
  mode: QuizMode;
  title: string;
  onBack: () => void;
}

export default function QuizEngine({ questions, subjectId, mode, title, onBack }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [userData, setUserData] = useState(loadUserData());

  const q = questions[current];
  if (!q) return <div className="p-8 text-center">Không có câu hỏi nào.</div>;

  const isRevealed = revealed[q.id] || false;
  const selectedAnswer = selected[q.id] || null;
  const sp = getSubjectProgress(userData, subjectId);
  const qp = getQuestionProgress(sp, q.id);

  const handleSelect = (letter: string) => {
    if (isRevealed) return;
    setSelected(prev => ({ ...prev, [q.id]: letter }));
    setRevealed(prev => ({ ...prev, [q.id]: true }));
    const isCorrect = letter === q.answer;
    const nd = recordAnswer(userData, subjectId, q.id, isCorrect);
    setUserData(nd);
  };

  const handleBookmark = () => {
    const nd = toggleBookmark(userData, subjectId, q.id);
    setUserData(nd);
  };

  const goNext = useCallback(() => {
    if (current < questions.length - 1) setCurrent(c => c + 1);
  }, [current, questions.length]);

  const goPrev = useCallback(() => {
    if (current > 0) setCurrent(c => c - 1);
  }, [current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (!isRevealed) {
        const keys: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        if (keys[e.key] && q.options[keys[e.key]]) handleSelect(keys[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, isRevealed, q]);

  const bookmarked = getQuestionProgress(getSubjectProgress(userData, subjectId), q.id).bookmarked;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-[var(--primary)] text-sm">← Quay lại</button>
        <span className="text-sm text-[var(--text-secondary)]">{title}</span>
      </div>

      <div className="text-sm text-[var(--text-secondary)] mb-2">Câu {current + 1} / {questions.length}</div>
      <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full mb-4">
        <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{width: `${((current + 1) / questions.length) * 100}%`}}></div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
        <p className="font-medium leading-relaxed">{q.question}</p>
      </div>

      <div className="space-y-3 mb-6">
        {Object.entries(q.options).map(([letter, text]) => {
          let cls = "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]";
          if (isRevealed) {
            if (letter === q.answer) cls = "bg-[var(--success-bg)] border-2 border-[var(--success)]";
            else if (letter === selectedAnswer && letter !== q.answer) cls = "bg-[var(--danger-bg)] border-2 border-[var(--danger)]";
            else cls = "bg-[var(--card)] border border-[var(--border)] opacity-60";
          } else if (letter === selectedAnswer) {
            cls = "bg-[var(--card)] border-2 border-[var(--primary)]";
          }
          return (
            <button key={letter} onClick={() => handleSelect(letter)} disabled={isRevealed}
              className={`w-full text-left p-4 rounded-xl transition-all ${cls} cursor-pointer`}>
              <span className="font-semibold mr-2">{letter}.</span>
              <span>{text}</span>
            </button>
          );
        })}
      </div>

      {isRevealed && (
        <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${selectedAnswer === q.answer ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--danger-bg)] text-[var(--danger)]'}`}>
          {selectedAnswer === q.answer ? '✓ Chính xác!' : `✗ Sai! Đáp án đúng: ${q.answer}`}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={goPrev} disabled={current === 0} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] disabled:opacity-30 text-sm">← Câu trước</button>
        <button onClick={handleBookmark} className="text-2xl">{bookmarked ? '★' : '☆'}</button>
        <button onClick={goNext} disabled={current === questions.length - 1} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white disabled:opacity-30 text-sm">Câu tiếp →</button>
      </div>
    </div>
  );
}
