import type { CvContent } from '@/features/cvs/cv-types';
import { CvSheetSection } from './cv-sheet-section';

function dateRange(start: string, end: string) {
  return [start, end].filter(Boolean).join(' – ');
}

export function CvSheet({ content }: { content: CvContent }) {
  const { contact, summary, experience, education, skills } = content;
  const contactItems = [
    contact.email,
    contact.phone,
    contact.location,
    ...contact.links.map((link) => link.url || link.label),
  ].filter(Boolean);

  return (
    <div className="@container w-full">
      <article
        aria-label="CV preview"
        className="min-h-[141.4cqw] bg-card p-[8cqw] text-[1.75cqw] leading-[1.45] break-words shadow-xl shadow-foreground/10 ring-1 ring-border"
      >
        <p className="font-serif text-[5.5cqw] leading-none font-light">
          {contact.fullName || 'Your name'}
        </p>
        {contact.headline && (
          <p className="mt-[1.8cqw] text-[1.8cqw] tracking-[0.12em] text-brand uppercase">
            {contact.headline}
          </p>
        )}
        {contactItems.length > 0 && (
          <p className="mt-[1.8cqw] text-muted-foreground">{contactItems.join('  ·  ')}</p>
        )}
        <div className="mt-[3.5cqw] h-px bg-foreground/15" />

        {summary && (
          <CvSheetSection title="Profile">
            <p>{summary}</p>
          </CvSheetSection>
        )}

        {experience.length > 0 && (
          <CvSheetSection title="Experience">
            <div className="space-y-[3cqw]">
              {experience.map((entry) => (
                <div key={entry.id}>
                  <div className="flex items-baseline justify-between gap-[2cqw]">
                    <p>
                      <span className="font-semibold">{entry.role}</span>
                      {entry.role && entry.company && ', '}
                      {entry.company}
                    </p>
                    <p className="shrink-0 text-muted-foreground">
                      {dateRange(entry.start, entry.end)}
                    </p>
                  </div>
                  {entry.location && <p className="text-muted-foreground">{entry.location}</p>}
                  {entry.bullets.some((bullet) => bullet.text) && (
                    <ul className="mt-[1cqw] list-disc space-y-[0.6cqw] pl-[3cqw] marker:text-brand">
                      {entry.bullets
                        .filter((bullet) => bullet.text)
                        .map((bullet) => (
                          <li key={bullet.id}>{bullet.text}</li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CvSheetSection>
        )}

        {education.length > 0 && (
          <CvSheetSection title="Education">
            <div className="space-y-[2.4cqw]">
              {education.map((entry) => (
                <div key={entry.id}>
                  <div className="flex items-baseline justify-between gap-[2cqw]">
                    <p>
                      <span className="font-semibold">{entry.degree}</span>
                      {entry.degree && entry.school && ', '}
                      {entry.school}
                    </p>
                    <p className="shrink-0 text-muted-foreground">
                      {dateRange(entry.start, entry.end)}
                    </p>
                  </div>
                  {entry.details && <p className="text-muted-foreground">{entry.details}</p>}
                </div>
              ))}
            </div>
          </CvSheetSection>
        )}

        {skills.length > 0 && (
          <CvSheetSection title="Skills">
            <p>{skills.map((skill) => skill.name).join('  ·  ')}</p>
          </CvSheetSection>
        )}
      </article>
    </div>
  );
}
