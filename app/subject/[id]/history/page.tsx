"use client";
import { useParams, useRouter } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { loadUserData, getSubjectProgress } from "@/lib/storage";

export default function HistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const d = loadUserData();
  const sp = getSubjectProgress(d, id);
  const history = [...sp.examHistory].reverse();

  const totalExams = history.length;
  const bestScore = totalExams > 0 ? Math.max(...history.map(h => h.correct)) : 0;
  const avgScore = totalExams > 0 ? history.reduce((s, h) => s + h.correct, 0) / totalExams : 0;
  const avgAccuracy = totalExams > 0 ? history.reduce((s, h) => s + h.accuracy, 0) / totalExams : 0;

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <h1 className="text-2xl font-bold mb-6">📜 Lịch Sử Luyện Đề</h1>

      {totalExams > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
              <div className="font-bold text-lg">{totalExams}</div>
              <div className="text-xs text-[var(--text-secondary)]">Số đề đã làm</div>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
              <div className="font-bold text-lg">{bestScore}/60</div>
              <div className="text-xs text-[var(--text-secondary)]">Điểm cao nhất</div>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
              <div className="font-bold text-lg">{avgScore.toFixed(1)}/60</div>
              <div className="text-xs text-[var(--text-secondary)]">Điểm trung bình</div>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
              <div className="font-bold text-lg">{avgAccuracy.toFixed(1)}%</div>
              <div className="text-xs text-[var(--text-secondary)]">Accuracy TB</div>
            </div>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
          <p>Chưa có lịch sử luyện đề.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((exam, i) => {
            const date = new Date(exam.date);
            const mins = Math.floor(exam.timeSeconds / 60);
            const secs = exam.timeSeconds % 60;
            return (
              <div key={exam.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">Đề #{totalExams - i}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{date.toLocaleDateString('vi-VN')} • {mins}:{secs.toString().padStart(2, '0')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{exam.correct}/60</div>
                    <div className={`text-xs font-medium ${exam.accuracy >= 80 ? 'text-[var(--success)]' : exam.accuracy >= 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'}`}>{exam.accuracy.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--success)]">✓ {exam.correct}</span>
                  <span className="text-[var(--danger)]">✗ {exam.wrong}</span>
                  <span>⬜ {exam.unanswered}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
