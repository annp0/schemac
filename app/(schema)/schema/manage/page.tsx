import { notFound } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { SchemaManager } from '@/components/schema-manager';

export default async function ManageSchemasPage() {
  // Authentication check
  const session = await auth();
  
  if (!session || !session.user) {
    return notFound();
  }
  
  // No need to fetch schemas server-side
  return <SchemaManager user={session.user} />;
}