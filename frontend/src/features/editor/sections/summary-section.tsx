import { SectionCard } from './section-card';
import { TextField } from './text-field';

export function SummarySection() {
  return (
    <SectionCard
      id="summary"
      title="Summary"
      description="Two or three sentences on who you are and what you’re looking for."
    >
      <TextField multiline hideLabel label="Summary" fieldRef={{ section: 'summary' }} />
    </SectionCard>
  );
}
