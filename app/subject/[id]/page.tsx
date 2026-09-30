"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Subject } from "@/types";
import { getSubject } from "@/lib/subjects";
import { loadUserData, getSubjectStats, updateSettings } from "@/lib/storage";

export default function SubjectDashboard() {
  const params = useParams();
  const id = params.id as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof getSubjectStats> | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const s = getSubject(id);
    setSubject(s);
    if (s) {
      const d = loadUserData();
      setStats(getSubjectStats(d, id, s.questionCount));
      const isDark = d.settings.theme === 'dark' || 
        (d.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setDark(isDark);
    }
  }, [id]);

  const toggleTheme = () => {
    const d = loadUserData();
    const newTheme = dark ? 'light' : 'dark';
    updateSettings(d, { theme: newTheme });
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  if (!subject) return <div className="p-8 text-center">Đang tải...</div>;

  const menuItems = [
    { href: `/subject/${id}/practice`, icon: '📝', label: 'Luyện tập', desc: 'Luyện từng câu với đáp án ngay' },
    { href: `/subject/${id}/exam`, icon: '📋', label: 'Luyện đề 60 câu', desc: 'Mô phỏng thi thật' },
    { href: `/subject/${id}/smart`, icon: '🧠', label: 'Ôn thông minh', desc: 'Ưu tiên câu cần ôn' },
    { href: `/subject/${id}/wrong`, icon: '❌', label: 'Ôn câu sai', desc: `${stats?.needsReview || 0} câu cần ôn` },
    { href: `/subject/${id}/bookmarks`, icon: '⭐', label: 'Câu đã đánh dấu', desc: `${stats?.bookmarked || 0} câu` },
    { href: `/subject/${id}/bank`, icon: '🏦', label: 'Ngân hàng câu hỏi', desc: `${subject.questionCount} câu` },
    { href: `/subject/${id}/stats`, icon: '📊', label: 'Thống kê', desc: 'Xem tiến độ học tập' },
    { href: `/subject/${id}/history`, icon: '📜', label: 'Lịch sử luyện đề', desc: 'Xem lại các đề đã làm' },
    { href: `/subject/${id}/settings`, icon: '⚙️', label: 'Cài đặt', desc: 'Reset, Export/Import' },
  ];

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-[var(--primary)] text-sm">← Trang chủ</Link>
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-xl">{dark ? '☀️' : '🌙'}</button>
        </div>
        <h1 className="text-2xl font-bold mb-1">{subject.name}</h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Ngân hàng: {subject.questionCount} câu hỏi</p>
        
        {stats && stats.answered > 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Tiến độ</span>
              <span>{stats.answered}/{stats.totalQuestions} ({stats.progressPercent.toFixed(0)}%)</span>
            </div>
            <div className="w-full h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{width: `${stats.progressPercent}%`}}></div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-[var(--text-secondary)]">
              <span>✓ Đúng: {stats.totalCorrect}</span>
              <span>✗ Sai: {stats.totalWrong}</span>
              <span>📊 {stats.accuracy.toFixed(1)}%</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {menuItems.map(item => (
            <Link key={item.href} href={item.href} className="block">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-md transition-all hover:scale-[1.01] flex items-center gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{item.desc}</div>
                </div>
                <span className="text-[var(--text-secondary)]">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
