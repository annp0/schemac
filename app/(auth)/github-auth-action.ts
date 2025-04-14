'use server';

import { signIn } from './auth';
import { redirect } from 'next/navigation';

export async function githubSignIn() {
  // Start the GitHub OAuth flow
  await signIn('github', { callbackUrl: '/' });
}