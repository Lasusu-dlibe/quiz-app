"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Question } from "@/types";
import { getSubject } from "@/lib/subjects";
import { loadUserData, getSubjectProgress, getQuestionProgress } from "@/lib/storage";
import QuizEngine from "@/components/QuizEngine";

export default function WrongPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const d = loadUserData();
  const sp = getSubjectProgress(d, id);
  const wrongQs = subject.questions.filter(q => {
    const qp = getQuestionProgress(sp, q.id);
    return qp.wrongCount > 0 && !qp.mastered && q.answer !== null;
  }).sort((a, b) => {
    const qa = getQuestionProgress(sp, a.id);
    const qb = getQuestionProgress(sp, b.id);
    return qb.wrongCount - qa.wrongCount;
  });

  const start = (count: number | 'all') => {
    let qs = [...wrongQs];
    if (count !== 'all') qs = qs.slice(0, count);
    setQuestions(qs);
    setStarted(true);
  };

  if (started) {
    return <QuizEngine questions={questions} subjectId={id} mode="review-wrong" title="Ôn câu sai" onBack={() => setStarted(false)} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <h1 className="text-2xl font-bold mb-2">❌ Ôn Câu Sai</h1>
      <p className="text-[var(--text-secondary)] mb-6">Bạn có {wrongQs.length} câu cần ôn</p>
      
      {wrongQs.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
          <p className="text-lg">🎉</p>
          <p className="mt-2">Bạn chưa có câu nào sai. Hãy tiếp tục luyện tập!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => start('all')} className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-medium">Ôn tất cả ({wrongQs.length} câu)</button>
          {wrongQs.length > 10 && <button onClick={() => start(10)} className="w-full py-3 bg-[var(--bg-secondary)] rounded-xl font-medium">Random 10 câu</button>}
          {wrongQs.length > 20 && <button onClick={() => start(20)} className="w-full py-3 bg-[var(--bg-secondary)] rounded-xl font-medium">Random 20 câu</button>}
        </div>
      )}
    </div>
  );
}
