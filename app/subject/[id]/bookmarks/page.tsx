"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Question } from "@/types";
import { getSubject } from "@/lib/subjects";
import { loadUserData, getSubjectProgress, getQuestionProgress } from "@/lib/storage";
import QuizEngine from "@/components/QuizEngine";

export default function BookmarksPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const d = loadUserData();
  const sp = getSubjectProgress(d, id);
  const bookmarkedQs = subject.questions.filter(q => getQuestionProgress(sp, q.id).bookmarked && q.answer !== null);

  if (started) {
    return <QuizEngine questions={questions} subjectId={id} mode="review-bookmarked" title="Câu đã đánh dấu" onBack={() => setStarted(false)} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <h1 className="text-2xl font-bold mb-2">⭐ Câu Đã Đánh Dấu</h1>
      <p className="text-[var(--text-secondary)] mb-6">{bookmarkedQs.length} câu</p>
      
      {bookmarkedQs.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
          <p>Chưa có câu hỏi nào được đánh dấu.</p>
        </div>
      ) : (
        <button onClick={() => { setQuestions(bookmarkedQs); setStarted(true); }}
          className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-medium">
          Luyện {bookmarkedQs.length} câu đã đánh dấu
        </button>
      )}
    </div>
  );
}
