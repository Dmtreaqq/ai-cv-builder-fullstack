import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginPage() {
  return (
    <section className="flex justify-center py-16 sm:py-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl tracking-tight">Log in</h1>
          </CardTitle>
          <CardDescription>Login page placeholder.</CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}
