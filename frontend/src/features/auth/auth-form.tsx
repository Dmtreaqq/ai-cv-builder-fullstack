import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, type Location } from 'react-router';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { loginRequest, registerRequest } from './auth-api';
import { useAuth } from './use-auth';
import { validateCredentials, type CredentialErrors } from './validate-credentials';

interface AuthFormProps {
  mode: 'login' | 'register';
}

const copy = {
  login: {
    title: 'Log in',
    description: 'Welcome back. Pick up where you left off.',
    submit: 'Log in',
    pending: 'Logging in…',
    switchPrompt: 'New here?',
    switchLabel: 'Create an account',
    switchTo: '/register',
  },
  register: {
    title: 'Register',
    description: 'Create an account to build and keep your tailored CVs.',
    submit: 'Create account',
    pending: 'Creating account…',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Log in',
    switchTo: '/login',
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const text = copy[mode];
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const credentials = { email: email.trim(), password };
    const nextErrors = validateCredentials(credentials);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPending(true);
    try {
      const request = mode === 'login' ? loginRequest : registerRequest;
      login(await request(credentials));
      navigate(from ? `${from.pathname}${from.search}` : '/cvs', { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
      setPending(false);
    }
  }

  return (
    <section className="flex justify-center py-16 sm:py-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl tracking-tight">{text.title}</h1>
          </CardTitle>
          <CardDescription>{text.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormField id="email" label="Email" error={errors.email}>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </FormField>
            <FormField id="password" label="Password" error={errors.password}>
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
            </FormField>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? text.pending : text.submit}
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            {text.switchPrompt}{' '}
            <Link
              to={text.switchTo}
              state={location.state}
              className="text-brand underline underline-offset-4 hover:no-underline"
            >
              {text.switchLabel}
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
