"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Question, ExamResult, ExamAnswer } from "@/types";
import { loadUserData, saveExamResult, recordAnswer, toggleBookmark, getSubjectProgress, getQuestionProgress } from "@/lib/storage";

interface Props {
  questions: Question[];
  subjectId: string;
  onFinish: (result: ExamResult) => void;
  onBack: () => void;
}

export default function ExamEngine({ questions, subjectId, onFinish, onBack }: Props) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const q = questions[current];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSelect = (letter: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [q.id]: letter }));
  };

  const handleBookmark = () => {
    setBookmarks(prev => {
      const n = new Set(prev);
      if (n.has(q.id)) n.delete(q.id); else n.add(q.id);
      return n;
    });
  };

  const goTo = (i: number) => setCurrent(i);
  const goNext = useCallback(() => { if (current < questions.length - 1) setCurrent(c => c + 1); }, [current, questions.length]);
  const goPrev = useCallback(() => { if (current > 0) setCurrent(c => c - 1); }, [current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showConfirm) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (!submitted) {
        const keys: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        if (keys[e.key] && q?.options[keys[e.key]]) handleSelect(keys[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, submitted, showConfirm, q]);

  const handleSubmit = () => {
    const unanswered = questions.filter(q => !answers[q.id]).length;
    if (unanswered > 0) { setShowConfirm(true); return; }
    doSubmit();
  };

  const doSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
    setShowConfirm(false);

    let correct = 0, wrong = 0, unanswered = 0;
    const examAnswers: ExamAnswer[] = questions.map(q => {
      const sel = answers[q.id] || null;
      if (!sel) { unanswered++; }
      else if (sel === q.answer) { correct++; }
      else { wrong++; }
      return { questionId: q.id, selectedAnswer: sel };
    });

    // Record each answer
    let d = loadUserData();
    for (const ea of examAnswers) {
      if (ea.selectedAnswer) {
        const isCorrect = ea.selectedAnswer === questions.find(q => q.id === ea.questionId)?.answer;
        d = recordAnswer(d, subjectId, ea.questionId, isCorrect);
      }
    }

    const r: ExamResult = {
      id: Date.now().toString(),
      subjectId,
      date: new Date().toISOString(),
      questionIds: questions.map(q => q.id),
      answers: examAnswers,
      correct, wrong, unanswered,
      accuracy: questions.length > 0 ? (correct / questions.length) * 100 : 0,
      timeSeconds: elapsed,
    };

    const nd = saveExamResult(d, r);
    setResult(r);
  };

  // Results view
  if (submitted && result && !reviewing) {
    const mins = Math.floor(result.timeSeconds / 60);
    const secs = result.timeSeconds % 60;
    return (
      <div className="max-w-xl mx-auto px-4 pt-8 pb-8 text-center">
        <h2 className="text-2xl font-bold mb-6">📋 Kết Quả</h2>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <div className="text-5xl font-bold mb-2">{result.correct} / {questions.length}</div>
          <div className="text-lg text-[var(--text-secondary)] mb-4">{result.accuracy.toFixed(1)}%</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-[var(--success-bg)] rounded-xl p-3"><div className="font-bold text-[var(--success)]">{result.correct}</div><div className="text-[var(--text-secondary)]">Đúng</div></div>
            <div className="bg-[var(--danger-bg)] rounded-xl p-3"><div className="font-bold text-[var(--danger)]">{result.wrong}</div><div className="text-[var(--text-secondary)]">Sai</div></div>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-3"><div className="font-bold">{result.unanswered}</div><div className="text-[var(--text-secondary)]">Bỏ trống</div></div>
          </div>
          <div className="mt-4 text-sm text-[var(--text-secondary)]">⏱ {mins} phút {secs} giây</div>
        </div>
        <div className="space-y-3">
          <button onClick={() => { setReviewing(true); setCurrent(0); }} className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-medium">Xem đáp án</button>
          <button onClick={() => onFinish(result)} className="w-full py-3 bg-[var(--bg-secondary)] rounded-xl font-medium">Về trang môn học</button>
        </div>
      </div>
    );
  }

  // Review mode after submission
  if (submitted && reviewing) {
    const sel = answers[q.id] || null;
    const isCorrect = sel === q.answer;
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setReviewing(false)} className="text-[var(--primary)] text-sm">← Kết quả</button>
          <span className="text-sm text-[var(--text-secondary)]">Xem đáp án</span>
        </div>
        <div className="text-sm text-[var(--text-secondary)] mb-4">Câu {current + 1} / {questions.length}</div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
          <p className="font-medium leading-relaxed">{q.question}</p>
        </div>
        <div className="space-y-3 mb-4">
          {Object.entries(q.options).map(([letter, text]) => {
            let cls = "bg-[var(--card)] border border-[var(--border)] opacity-60";
            if (letter === q.answer) cls = "bg-[var(--success-bg)] border-2 border-[var(--success)]";
            if (letter === sel && letter !== q.answer) cls = "bg-[var(--danger-bg)] border-2 border-[var(--danger)]";
            return (
              <div key={letter} className={`p-4 rounded-xl ${cls}`}>
                <span className="font-semibold mr-2">{letter}.</span><span>{text}</span>
              </div>
            );
          })}
        </div>
        <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${!sel ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]' : isCorrect ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--danger-bg)] text-[var(--danger)]'}`}>
          {!sel ? 'Bạn chưa trả lời câu này.' : isCorrect ? '✓ Chính xác!' : `✗ Sai! Bạn chọn: ${sel}. Đáp án đúng: ${q.answer}`}
        </div>
        <div className="flex justify-between">
          <button onClick={goPrev} disabled={current === 0} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] disabled:opacity-30 text-sm">← Câu trước</button>
          <button onClick={goNext} disabled={current === questions.length - 1} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white disabled:opacity-30 text-sm">Câu tiếp →</button>
        </div>
        {/* Navigator */}
        <div className="mt-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="grid grid-cols-10 gap-1.5">
            {questions.map((qu, i) => {
              const s = answers[qu.id] || null;
              const isC = s === qu.answer;
              let bg = 'bg-[var(--bg-secondary)]';
              if (s) bg = isC ? 'bg-[var(--success)] text-white' : 'bg-[var(--danger)] text-white';
              if (i === current) bg += ' ring-2 ring-[var(--primary)]';
              return <button key={i} onClick={() => setCurrent(i)} className={`w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center ${bg}`}>{i + 1}</button>;
            })}
          </div>
        </div>
      </div>
    );
  }

  // Exam in progress
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Xác nhận nộp bài</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              Bạn còn {questions.filter(q => !answers[q.id]).length}/{questions.length} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] text-sm font-medium">Quay lại làm</button>
              <button onClick={doSubmit} className="flex-1 py-2 rounded-lg bg-[var(--danger)] text-white text-sm font-medium">Vẫn nộp bài</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-[var(--primary)] text-sm">← Hủy</button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono bg-[var(--bg-secondary)] px-3 py-1 rounded-lg">⏱ {formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="text-sm text-[var(--text-secondary)] mb-2">ĐỀ THI THỬ • Câu {current + 1} / {questions.length}</div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
        <p className="font-medium leading-relaxed">{q.question}</p>
      </div>

      <div className="space-y-3 mb-6">
        {Object.entries(q.options).map(([letter, text]) => {
          const isSelected = answers[q.id] === letter;
          const cls = isSelected
            ? "bg-[var(--primary)] text-white border-2 border-[var(--primary)]"
            : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]";
          return (
            <button key={letter} onClick={() => handleSelect(letter)}
              className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${cls}`}>
              <span className="font-semibold mr-2">{letter}.</span><span>{text}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center mb-6">
        <button onClick={goPrev} disabled={current === 0} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] disabled:opacity-30 text-sm">← Câu trước</button>
        <button onClick={handleBookmark} className="text-2xl">{bookmarks.has(q.id) ? '★' : '☆'}</button>
        <button onClick={goNext} disabled={current === questions.length - 1} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] disabled:opacity-30 text-sm">Câu tiếp →</button>
      </div>

      {/* Navigator */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-4">
        <div className="text-xs text-[var(--text-secondary)] mb-2 font-medium">BẢNG CÂU HỎI</div>
        <div className="grid grid-cols-10 gap-1.5">
          {questions.map((qu, i) => {
            let bg = 'bg-[var(--bg-secondary)]';
            if (answers[qu.id]) bg = 'bg-[var(--primary)] text-white';
            if (bookmarks.has(qu.id)) bg = 'bg-[var(--warning)] text-white';
            if (i === current) bg += ' ring-2 ring-[var(--text)]';
            return <button key={i} onClick={() => goTo(i)} className={`w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center ${bg}`}>{i + 1}</button>;
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-[var(--text-secondary)]">
          <span>⬜ Chưa trả lời</span>
          <span className="text-[var(--primary)]">🟦 Đã trả lời</span>
          <span className="text-[var(--warning)]">🟨 Đánh dấu</span>
        </div>
      </div>

      <button onClick={handleSubmit} className="w-full py-3 bg-[var(--danger)] text-white rounded-xl font-bold text-lg">NỘP BÀI</button>
    </div>
  );
}
