import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RegisterPage() {
  return (
    <section className="flex justify-center py-16 sm:py-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl tracking-tight">Register</h1>
          </CardTitle>
          <CardDescription>Register page placeholder.</CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}
