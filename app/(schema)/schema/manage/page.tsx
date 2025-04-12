import { notFound } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { getSchemasByUserId } from '@/lib/db/queries';
import { SchemaManager } from '@/components/schema-manager';

export default async function ManageSchemasPage() {
  // Authentication check (similar to chat page)
  const session = await auth();
  
  if (!session || !session.user) {
    return notFound();
  }
  
  // Server-side data fetching (like in chat page)
  const schemas = await getSchemasByUserId({
    userId: session.user.id
  });

  return <SchemaManager initialSchemas={schemas} user={session.user} />;
}