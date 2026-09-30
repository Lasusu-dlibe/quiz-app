import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luyện Thi Trắc Nghiệm",
  description: "Nền tảng luyện thi trắc nghiệm trực tuyến",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const d = JSON.parse(localStorage.getItem('quiz-app-data') || '{}');
            const t = d?.settings?.theme || 'system';
            if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
        {children}
      </body>
    </html>
  );
}
