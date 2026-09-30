"use client";
import { useParams, useRouter } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { loadUserData, getSubjectStats, getSubjectProgress, getQuestionProgress } from "@/lib/storage";

export default function StatsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const d = loadUserData();
  const stats = getSubjectStats(d, id, subject.questionCount);
  const sp = getSubjectProgress(d, id);

  // Top wrong questions
  const topWrong = subject.questions
    .map(q => ({ q, qp: getQuestionProgress(sp, q.id) }))
    .filter(x => x.qp.wrongCount > 0)
    .sort((a, b) => b.qp.wrongCount - a.qp.wrongCount)
    .slice(0, 10);

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <h1 className="text-2xl font-bold mb-6">📊 Thống Kê</h1>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-3">Tổng quan</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ngân hàng', value: stats.totalQuestions },
            { label: 'Đã luyện', value: stats.answered },
            { label: 'Chưa luyện', value: stats.unanswered },
            { label: 'Đúng', value: stats.totalCorrect },
            { label: 'Sai', value: stats.totalWrong },
            { label: 'Accuracy', value: `${stats.accuracy.toFixed(1)}%` },
            { label: 'Đã thuộc', value: stats.mastered },
            { label: 'Cần ôn', value: stats.needsReview },
            { label: 'Bookmark', value: stats.bookmarked },
          ].map(item => (
            <div key={item.label} className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
              <div className="font-bold text-lg">{item.value}</div>
              <div className="text-xs text-[var(--text-secondary)]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-3">Tiến độ</h2>
        <div className="flex justify-between text-sm mb-1">
          <span>{stats.answered}/{stats.totalQuestions}</span>
          <span>{stats.progressPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full h-4 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{width: `${stats.progressPercent}%`}}></div>
        </div>
      </div>

      {topWrong.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3">🔥 Top câu sai nhiều nhất</h2>
          <div className="space-y-2">
            {topWrong.map(({ q, qp }) => (
              <div key={q.id} className="flex items-center gap-3 text-sm bg-[var(--bg-secondary)] rounded-lg p-3">
                <span className="font-mono text-xs text-[var(--text-secondary)]">#{q.id}</span>
                <span className="flex-1 truncate">{q.question}</span>
                <span className="text-[var(--danger)] font-medium whitespace-nowrap">sai {qp.wrongCount}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
