const sections = [
  { title: 'Experience', lines: ['w-11/12', 'w-full', 'w-3/4', 'w-10/12', 'w-2/3'] },
  { title: 'Education', lines: ['w-10/12', 'w-1/2'] },
  { title: 'Projects', lines: ['w-full', 'w-9/12', 'w-10/12'] },
  { title: 'Skills', lines: ['w-full', 'w-3/5'] },
];

export function CvSheetPreview() {
  return (
    <div
      aria-hidden="true"
      className="@container relative mx-auto w-full max-w-[280px] select-none sm:max-w-[340px] lg:max-w-[390px]"
    >
      <div className="aspect-[1/1.414] bg-card p-[10cqw] shadow-2xl shadow-foreground/15 ring-1 ring-border lg:rotate-[1.5deg]">
        <p className="font-serif text-[8cqw] leading-none font-light">Alex Morgan</p>
        <p className="mt-[2.5cqw] text-[3.2cqw] tracking-[0.12em] text-brand uppercase">
          Product Designer
        </p>
        <div className="mt-[5cqw] h-px bg-foreground/15" />
        {sections.map((section) => (
          <div key={section.title} className="mt-[6cqw]">
            <p className="text-[3cqw] font-semibold tracking-[0.12em] uppercase">{section.title}</p>
            <div className="mt-[3cqw] space-y-[2.2cqw]">
              {section.lines.map((width, index) => (
                <div key={index} className={`h-[1.4cqw] rounded-full bg-foreground/10 ${width}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="absolute top-[18%] -left-3 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs shadow-sm ring-1 ring-border sm:-left-8">
        <span className="size-1.5 rounded-full bg-brand" />
        Tailored for the role
      </span>
    </div>
  );
}
