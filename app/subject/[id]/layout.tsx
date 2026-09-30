import React from "react";
import { getSubjectList } from "@/lib/subjects";

export function generateStaticParams() {
  const subjects = getSubjectList();
  return subjects.map((s) => ({
    id: s.id,
  }));
}

export default function SubjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
