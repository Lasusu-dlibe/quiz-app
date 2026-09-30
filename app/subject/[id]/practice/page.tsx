"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Question, PracticeConfig } from "@/types";
import { getSubject } from "@/lib/subjects";
import { loadUserData, getSubjectProgress, getQuestionProgress } from "@/lib/storage";
import QuizEngine from "@/components/QuizEngine";

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<PracticeConfig>({
    questionCount: 20, order: 'sequential', shuffleOptions: false, onlyUnanswered: false, onlyWrong: false
  });

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const startPractice = () => {
    let qs = [...subject.questions.filter(q => q.answer !== null)];
    const d = loadUserData();
    const sp = getSubjectProgress(d, id);

    if (config.onlyUnanswered) {
      qs = qs.filter(q => {
        const qp = getQuestionProgress(sp, q.id);
        return qp.correctCount === 0 && qp.wrongCount === 0;
      });
    }
    if (config.onlyWrong) {
      qs = qs.filter(q => {
        const qp = getQuestionProgress(sp, q.id);
        return qp.wrongCount > 0;
      });
    }

    if (config.order === 'random') {
      qs.sort(() => Math.random() - 0.5);
    }

    if (config.questionCount !== 'all') {
      qs = qs.slice(0, config.questionCount);
    }

    if (qs.length === 0) {
      alert('Không có câu hỏi phù hợp với bộ lọc đã chọn.');
      return;
    }

    setQuestions(qs);
    setStarted(true);
  };

  if (started) {
    return <QuizEngine questions={questions} subjectId={id} mode="practice" title="Luyện tập" onBack={() => setStarted(false)} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <h1 className="text-2xl font-bold mb-6">📝 Luyện Tập</h1>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
        <label className="block text-sm font-medium mb-2">Số câu hỏi</label>
        <div className="grid grid-cols-5 gap-2">
          {([10, 20, 30, 50, 'all'] as const).map(n => (
            <button key={String(n)} onClick={() => setConfig(c => ({ ...c, questionCount: n }))}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${config.questionCount === n ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-secondary)]'}`}>
              {n === 'all' ? 'Tất cả' : n}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
        <label className="block text-sm font-medium mb-2">Thứ tự</label>
        <div className="grid grid-cols-2 gap-2">
          {(['sequential', 'random'] as const).map(o => (
            <button key={o} onClick={() => setConfig(c => ({ ...c, order: o }))}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${config.order === o ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-secondary)]'}`}>
              {o === 'sequential' ? 'Theo tài liệu' : 'Ngẫu nhiên'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium mb-3">Tùy chọn</label>
        <div className="space-y-3">
          {[
            { key: 'onlyUnanswered' as const, label: 'Chỉ luyện câu chưa làm' },
            { key: 'onlyWrong' as const, label: 'Chỉ luyện câu từng làm sai' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={config[opt.key]} onChange={e => setConfig(c => ({ ...c, [opt.key]: e.target.checked }))}
                className="w-5 h-5 rounded accent-[var(--primary)]" />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={startPractice} className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-bold text-lg">BẮT ĐẦU LUYỆN TẬP</button>
    </div>
  );
}
