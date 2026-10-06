import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { ComposerPreview } from './composer-preview';
import { CvSheetPreview } from './cv-sheet-preview';

export function Hero() {
  const { user } = useAuth();

  return (
    <section className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-6">
        <p className="flex items-center gap-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          <span className="h-px w-8 bg-foreground/30" />
          AI CV Builder
        </p>
        <h1 className="text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          A CV written for the role you want
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Upload your current CV or describe your background, name the role you’re after, then
          review, edit and download a tailored CV as a PDF.
        </p>
        <ComposerPreview />
        {user ? (
          <p className="text-sm text-muted-foreground">CV creation is coming soon.</p>
        ) : (
          <div>
            <Button asChild size="lg">
              <Link to="/register">
                Build my CV
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        )}
      </div>
      <CvSheetPreview />
    </section>
  );
}
