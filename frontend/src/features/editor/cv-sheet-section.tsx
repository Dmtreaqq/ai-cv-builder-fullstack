import type { ReactNode } from 'react';

export function CvSheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-[4.5cqw]">
      <p className="mb-[1.8cqw] text-[1.6cqw] font-semibold tracking-[0.14em] uppercase">{title}</p>
      {children}
    </div>
  );
}
