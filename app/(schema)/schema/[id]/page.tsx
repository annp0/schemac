import { notFound } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { getSchemaById } from '@/lib/db/queries';
import { SchemaEditor } from '@/components/schema-editor';

export default async function SchemaPage({ params }) {
  // Authentication check

  const { id } = await params;

  const session = await auth();
  
  if (!session || !session.user) {
    return notFound();
  }
  
  // Fetch the schema by ID
  const schema = await getSchemaById({ id: id });
  
  if (!schema) {
    return notFound();
  }
  
  // Authorization check (ensure the user owns this schema)
  if (schema.userId !== session.user.id) {
    return notFound();
  }

  return <SchemaEditor initialSchema={schema} user={session.user} />;
}