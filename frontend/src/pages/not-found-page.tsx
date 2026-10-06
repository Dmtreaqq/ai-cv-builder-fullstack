import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="flex flex-col gap-4 py-24">
      <h1 className="text-4xl tracking-tight sm:text-5xl">404 – Page not found</h1>
      <p className="text-muted-foreground">
        <Link to="/" className="text-brand underline underline-offset-4 hover:no-underline">
          Back to home
        </Link>
      </p>
    </section>
  );
}
