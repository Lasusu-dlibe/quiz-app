"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Question, ExamResult } from "@/types";
import { getSubject } from "@/lib/subjects";
import ExamEngine from "@/components/ExamEngine";

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [started, setStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const validQuestions = subject.questions.filter(q => q.answer !== null);

  if (validQuestions.length < 60) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
        <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
          <p className="text-lg">📋</p>
          <p className="mt-2 font-medium">Ngân hàng câu hỏi hiện chưa đủ 60 câu để tạo đề.</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Hiện có {validQuestions.length} câu hỏi hợp lệ.</p>
        </div>
      </div>
    );
  }

  const startExam = () => {
    const shuffled = [...validQuestions].sort(() => Math.random() - 0.5);
    setExamQuestions(shuffled.slice(0, 60));
    setStarted(true);
  };

  if (started) {
    return <ExamEngine questions={examQuestions} subjectId={id} onFinish={() => router.push(`/subject/${id}`)} onBack={() => setStarted(false)} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">📋 Luyện Đề Thi</h1>
        <p className="text-[var(--text-secondary)] mb-6">60 câu hỏi ngẫu nhiên • Không hiển thị đáp án khi làm bài</p>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
          <div className="text-4xl mb-2">60</div>
          <div className="text-sm text-[var(--text-secondary)]">câu hỏi / đề</div>
        </div>
        <button onClick={startExam} className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-bold text-lg">TẠO ĐỀ MỚI</button>
      </div>
    </div>
  );
}
