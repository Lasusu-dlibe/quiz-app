"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Question } from "@/types";
import { getSubject } from "@/lib/subjects";
import { loadUserData, getSubjectProgress, getQuestionProgress, getSmartReviewScore } from "@/lib/storage";
import QuizEngine from "@/components/QuizEngine";

export default function SmartPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const start = (count: number) => {
    const d = loadUserData();
    const sp = getSubjectProgress(d, id);
    const scored = subject.questions.filter(q => q.answer !== null).map(q => ({
      question: q,
      score: getSmartReviewScore(getQuestionProgress(sp, q.id))
    })).sort((a, b) => b.score - a.score);

    setQuestions(scored.slice(0, count).map(s => s.question));
    setStarted(true);
  };

  if (started) {
    return <QuizEngine questions={questions} subjectId={id} mode="review-smart" title="Ôn thông minh" onBack={() => setStarted(false)} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <h1 className="text-2xl font-bold mb-2">🧠 Ôn Thông Minh</h1>
      <p className="text-[var(--text-secondary)] mb-6">Ưu tiên câu sai nhiều, chưa làm, lâu chưa ôn</p>
      <div className="space-y-3">
        <button onClick={() => start(10)} className="w-full py-3 bg-[var(--bg-secondary)] rounded-xl font-medium">10 câu</button>
        <button onClick={() => start(20)} className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-medium">20 câu (Khuyên dùng)</button>
        <button onClick={() => start(30)} className="w-full py-3 bg-[var(--bg-secondary)] rounded-xl font-medium">30 câu</button>
        <button onClick={() => start(50)} className="w-full py-3 bg-[var(--bg-secondary)] rounded-xl font-medium">50 câu</button>
      </div>
    </div>
  );
}
