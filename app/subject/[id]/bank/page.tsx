"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { loadUserData, getSubjectProgress, getQuestionProgress } from "@/lib/storage";

type Filter = 'all' | 'unanswered' | 'answered' | 'wrong' | 'mastered' | 'bookmarked' | 'needsReview';

export default function BankPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const d = loadUserData();
  const sp = getSubjectProgress(d, id);

  const filtered = useMemo(() => {
    let qs = subject.questions;
    if (search) {
      const s = search.toLowerCase();
      qs = qs.filter(q => q.question.toLowerCase().includes(s));
    }
    if (filter !== 'all') {
      qs = qs.filter(q => {
        const qp = getQuestionProgress(sp, q.id);
        switch (filter) {
          case 'unanswered': return qp.correctCount === 0 && qp.wrongCount === 0;
          case 'answered': return qp.correctCount > 0 || qp.wrongCount > 0;
          case 'wrong': return qp.wrongCount > 0 && !qp.mastered;
          case 'mastered': return qp.mastered;
          case 'bookmarked': return qp.bookmarked;
          case 'needsReview': return q.needsReview;
          default: return true;
        }
      });
    }
    return qs;
  }, [subject.questions, search, filter, sp]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unanswered', label: 'Chưa làm' },
    { key: 'answered', label: 'Đã làm' },
    { key: 'wrong', label: 'Câu sai' },
    { key: 'mastered', label: 'Đã thuộc' },
    { key: 'bookmarked', label: 'Bookmark' },
    { key: 'needsReview', label: 'Cần review' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <h1 className="text-2xl font-bold mb-4">🏦 Ngân Hàng Câu Hỏi</h1>
      
      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm kiếm câu hỏi..."
        className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] mb-4 text-sm outline-none focus:border-[var(--primary)]" />
      
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filter === f.key ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-secondary)]'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-3">{filtered.length} câu hỏi</p>

      <div className="space-y-2">
        {filtered.slice(0, 50).map(q => {
          const qp = getQuestionProgress(sp, q.id);
          const isExpanded = expanded === q.id;
          return (
            <div key={q.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : q.id)} className="w-full text-left p-4 flex items-start gap-3">
                <span className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">#{q.id}</span>
                <span className="flex-1 text-sm leading-relaxed">{q.question.slice(0, 100)}{q.question.length > 100 ? '...' : ''}</span>
                <span className="text-xs text-[var(--text-secondary)]">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[var(--border)] pt-3">
                  <p className="text-sm mb-3">{q.question}</p>
                  <div className="space-y-1.5 mb-3">
                    {Object.entries(q.options).map(([letter, text]) => (
                      <div key={letter} className={`text-sm p-2 rounded-lg ${letter === q.answer ? 'bg-[var(--success-bg)] font-medium' : 'bg-[var(--bg-secondary)]'}`}>
                        <span className="font-semibold mr-1">{letter}.</span> {text}
                        {letter === q.answer && <span className="ml-2">✓</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
                    <span>✓ Đúng: {qp.correctCount}</span>
                    <span>✗ Sai: {qp.wrongCount}</span>
                    {qp.bookmarked && <span>⭐ Bookmark</span>}
                    {qp.mastered && <span>✅ Đã thuộc</span>}
                    {q.needsReview && <span className="text-[var(--warning)]">⚠ Cần review</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length > 50 && <p className="text-center text-sm text-[var(--text-secondary)] py-4">Hiển thị 50/{filtered.length} câu. Dùng tìm kiếm để lọc thêm.</p>}
      </div>
    </div>
  );
}
