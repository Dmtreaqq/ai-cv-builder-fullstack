import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CvSheet } from './cv-sheet';
import { QuestionsPanel } from './questions-panel';
import { SaveIndicator } from './save-indicator';
import { SectionIndex } from './section-index';
import { ContactSection } from './sections/contact-section';
import { EducationSection } from './sections/education-section';
import { ExperienceSection } from './sections/experience-section';
import { SkillsSection } from './sections/skills-section';
import { SummarySection } from './sections/summary-section';
import { useEditor } from './use-editor';

type View = 'edit' | 'preview';

export function EditorLayout() {
  const { title, targetRole, content } = useEditor();
  const [view, setView] = useState<View>('edit');

  return (
    <section className="flex flex-col gap-6 py-8 sm:py-10">
      <PageHeader
        backTo="/cvs"
        backLabel="All CVs"
        title={title}
        meta={
          <>
            {targetRole} · <SaveIndicator />
          </>
        }
      />
      <Tabs
        value={view}
        onValueChange={(value) => setView(value as View)}
        className="flex flex-col gap-6"
      >
        <div className="sticky top-0 z-20 -mx-4 -mt-2 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
          <TabsList>
            <TabsTrigger value="edit" className="px-4">
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="px-4">
              Preview
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="grid gap-8 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,0.85fr)] lg:items-start">
          <TabsContent
            value="edit"
            forceMount
            className={cn(
              'flex min-w-0 flex-col gap-6 lg:contents',
              view !== 'edit' && 'max-lg:hidden',
            )}
          >
            <SectionIndex />
            <div className="flex min-w-0 flex-col gap-6">
              <QuestionsPanel />
              <ContactSection />
              <SummarySection />
              <ExperienceSection />
              <EducationSection />
              <SkillsSection />
            </div>
          </TabsContent>
          <TabsContent
            value="preview"
            forceMount
            className={cn(
              'min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:overflow-y-auto lg:p-1 lg:pb-8',
              view !== 'preview' && 'max-lg:hidden',
            )}
          >
            <CvSheet content={content} />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
