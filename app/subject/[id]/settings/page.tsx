"use client";
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { loadUserData, resetSubjectData, resetAllData, exportProgress, importProgress } from "@/lib/storage";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [showConfirm, setShowConfirm] = useState<'subject' | 'all' | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const subject = getSubject(id);
  if (!subject) return <div className="p-8 text-center">Môn học không tồn tại.</div>;

  const handleExport = () => {
    const d = loadUserData();
    const json = exportProgress(d);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importProgress(reader.result as string);
      if (result) {
        setImportStatus('✓ Import thành công!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('✗ File không hợp lệ.');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleReset = (type: 'subject' | 'all') => {
    if (type === 'subject') {
      resetSubjectData(loadUserData(), id);
    } else {
      resetAllData();
    }
    setShowConfirm(null);
    router.push(`/subject/${id}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">⚠️ Xác nhận</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Thao tác này sẽ xóa toàn bộ {showConfirm === 'subject' ? `tiến độ môn ${subject.name}` : 'dữ liệu học tập'} và không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] text-sm font-medium">Hủy</button>
              <button onClick={() => handleReset(showConfirm)} className="flex-1 py-2 rounded-lg bg-[var(--danger)] text-white text-sm font-medium">Xóa dữ liệu</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => router.push(`/subject/${id}`)} className="text-[var(--primary)] text-sm mb-6 block">← Quay lại</button>
      <h1 className="text-2xl font-bold mb-6">⚙️ Cài Đặt</h1>

      <div className="space-y-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3">📤 Export / Import</h2>
          <div className="space-y-3">
            <button onClick={handleExport} className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-medium text-sm">Export tiến độ (JSON)</button>
            <div>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="import-file" />
              <label htmlFor="import-file" className="block w-full py-3 bg-[var(--bg-secondary)] rounded-xl font-medium text-sm text-center cursor-pointer">Import tiến độ (JSON)</label>
            </div>
            {importStatus && <p className="text-sm text-center">{importStatus}</p>}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3">🗑️ Reset dữ liệu</h2>
          <div className="space-y-3">
            <button onClick={() => setShowConfirm('subject')} className="w-full py-3 bg-[var(--warning-bg)] text-[var(--warning)] rounded-xl font-medium text-sm">Reset tiến độ môn này</button>
            <button onClick={() => setShowConfirm('all')} className="w-full py-3 bg-[var(--danger-bg)] text-[var(--danger)] rounded-xl font-medium text-sm">Reset toàn bộ tiến độ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
