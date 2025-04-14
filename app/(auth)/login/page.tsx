'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { githubSignIn } from '@/app/(auth)/github-auth-action';
import Image from 'next/image';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.refresh();
    } else if (state.status === 'disabled') {
      toast({ 
        type: 'error', 
        description: 'Registrations are currently disabled!'
      });
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="w-full max-w-md flex flex-col gap-8 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            className="dark:invert"
            width={60}
            height={60}
          />
          <h3 className="text-xl font-semibold text-foreground">Schemac - Sign In</h3>
          
          <p className="text-sm text-muted-foreground">
            Use your email and password to sign in
          </p>
          
          <div className="mt-4 w-full sm:px-16">
            <p className="mb-3 text-sm text-muted-foreground">
              Sign in with third-party providers
            </p>
            <button
              type="button"
              onClick={() => githubSignIn()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Sign in with GitHub
            </button>
          </div>
        </div>
        
        <div className="relative flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-border"></span>
          <span className="relative bg-card px-2 text-xs text-muted-foreground">OR</span>
        </div>
        
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="mt-2 text-xs text-muted-foreground">
            Registration via Email and Password is paused due to spam accounts and delivery issues
            with verification emails. Please use third party providers to sign in.
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
