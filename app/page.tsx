"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SubjectMeta } from "@/types";
import { getSubjectList } from "@/lib/subjects";
import { loadUserData, getSubjectStats, updateSettings } from "@/lib/storage";

export default function Home() {
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setSubjects(getSubjectList());
    const d = loadUserData();
    const isDark = d.settings.theme === 'dark' || 
      (d.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
  }, []);

  const toggleTheme = () => {
    const d = loadUserData();
    const newTheme = dark ? 'light' : 'dark';
    updateSettings(d, { theme: newTheme });
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">📚 Luyện Thi Trắc Nghiệm</h1>
            <p className="text-[var(--text-secondary)] mt-1">Chọn môn học để bắt đầu</p>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:opacity-80 text-xl" title="Đổi giao diện">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="space-y-4">
          {subjects.map(s => (
            <Link key={s.id} href={`/subject/${s.id}`} className="block">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.01]">
                <h2 className="text-xl font-semibold mb-2">📚 {s.name}</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-4">{s.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">{s.questionCount} câu hỏi</span>
                  <span className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-medium">BẮT ĐẦU HỌC →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
