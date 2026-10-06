import { lazy, Suspense, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LayoutModeToggle } from './layout-mode-toggle';
import { DownloadPdfButton } from './pdf/download-pdf-button';
import { PdfSheetSkeleton } from './pdf/pdf-sheet-skeleton';
import { QuestionsPanel } from './questions-panel';
import { SaveIndicator } from './save-indicator';
import { ContactSection } from './sections/contact-section';
import { EducationSection } from './sections/education-section';
import { ExperienceSection } from './sections/experience-section';
import { SkillsSection } from './sections/skills-section';
import { SummarySection } from './sections/summary-section';
import { useEditor } from './use-editor';
import { useEditorLayoutMode } from './use-editor-layout-mode';

const PdfPreview = lazy(() =>
  import('./pdf/pdf-preview').then((module) => ({ default: module.PdfPreview })),
);

type View = 'edit' | 'preview';

export function EditorLayout() {
  const { title, targetRole, content } = useEditor();
  const [view, setView] = useState<View>('edit');
  const [mode, setMode] = useEditorLayoutMode();
  const tabs = mode === 'tabs';
  const inactiveClass = tabs ? 'hidden' : 'max-lg:hidden';

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
        actions={
          <div className="hidden items-center gap-3 lg:flex">
            <LayoutModeToggle mode={mode} onChange={setMode} />
            <DownloadPdfButton />
          </div>
        }
      />
      <Tabs
        value={view}
        onValueChange={(value) => setView(value as View)}
        className="flex flex-col gap-6"
      >
        <div
          className={cn(
            'sticky top-0 z-20 -mx-4 -mt-2 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6',
            tabs ? 'lg:justify-center' : 'lg:hidden',
          )}
        >
          <TabsList>
            <TabsTrigger value="edit" className="px-4">
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="px-4">
              Preview
            </TabsTrigger>
          </TabsList>
          <div className="lg:hidden">
            <DownloadPdfButton size="sm" />
          </div>
        </div>
        <div
          className={cn(
            'grid grid-cols-1 gap-8',
            tabs
              ? 'mx-auto w-full max-w-3xl'
              : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-start',
          )}
        >
          <TabsContent
            value="edit"
            forceMount
            className={cn('flex min-w-0 flex-col gap-6', view !== 'edit' && inactiveClass)}
          >
            <QuestionsPanel />
            <ContactSection />
            <SummarySection />
            <ExperienceSection />
            <EducationSection />
            <SkillsSection />
          </TabsContent>
          <TabsContent
            value="preview"
            forceMount
            className={cn(
              'min-w-0',
              !tabs &&
                'lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:overflow-y-auto lg:p-1 lg:pb-8',
              view !== 'preview' && inactiveClass,
            )}
          >
            <Suspense fallback={<PdfSheetSkeleton />}>
              <PdfPreview content={content} />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
