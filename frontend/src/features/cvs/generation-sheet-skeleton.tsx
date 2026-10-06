const sections = [
  ['w-11/12', 'w-full', 'w-3/4', 'w-10/12'],
  ['w-10/12', 'w-1/2'],
  ['w-full', 'w-3/5'],
];

export function GenerationSheetSkeleton() {
  return (
    <div aria-hidden="true" className="@container mx-auto w-full max-w-[340px] select-none">
      <div className="aspect-[1/1.414] animate-pulse bg-card p-[10cqw] shadow-xl shadow-foreground/10 ring-1 ring-border">
        <div className="h-[5cqw] w-3/5 rounded-full bg-foreground/15" />
        <div className="mt-[3cqw] h-[2cqw] w-2/5 rounded-full bg-brand/30" />
        <div className="mt-[5cqw] h-px bg-foreground/15" />
        {sections.map((lines, sectionIndex) => (
          <div key={sectionIndex} className="mt-[7cqw]">
            <div className="h-[1.8cqw] w-1/4 rounded-full bg-foreground/20" />
            <div className="mt-[3cqw] space-y-[2.2cqw]">
              {lines.map((width, index) => (
                <div key={index} className={`h-[1.4cqw] rounded-full bg-foreground/10 ${width}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
