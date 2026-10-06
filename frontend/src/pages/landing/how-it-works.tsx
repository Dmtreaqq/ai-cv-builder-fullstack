const steps = [
  {
    title: 'Upload or describe',
    body: 'Start from your existing CV as a PDF, or tell us about your experience in your own words.',
  },
  {
    title: 'Name the role',
    body: 'Say what you’re applying for. Your CV is written around that role, not a generic template.',
  },
  {
    title: 'Review, edit, download PDF',
    body: 'Adjust any section until it reads right, then download a clean PDF ready to send.',
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works"
      className="border-t border-border py-[clamp(72px,10vw,140px)]"
    >
      <h2 id="how-it-works" className="text-3xl tracking-tight sm:text-4xl">
        How it works
      </h2>
      <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3">
            <span className="font-serif text-5xl leading-none font-light text-brand">
              {index + 1}
            </span>
            <h3 className="text-lg font-medium">{step.title}</h3>
            <p className="text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
