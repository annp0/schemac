"use server";

import { signIn, signOut } from "@/app/(auth)/auth"

export async function GitHubSignIn() {
  await signIn("github")
}
