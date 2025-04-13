import { notFound } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { getSchemaById } from '@/lib/db/queries';
import { SchemaEditor } from '@/components/schema-editor';

export default async function SchemaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const session = await auth();
  
  if (!session || !session.user) {
    return notFound();
  }
  
  // Fetch the schema by ID
  const rawSchema = await getSchemaById({ id: id });
  
  if (!rawSchema) {
    return notFound();
  }
  
  // Authorization check (ensure the user owns this schema)
  if (rawSchema.userId !== session.user.id) {
    return notFound();
  }

  // Parse content and docText to match the UserSchema type
  const schema = {
    ...rawSchema,
    content: Array.isArray(rawSchema.content) ? rawSchema.content : [],
    docText: Array.isArray(rawSchema.docText) ? rawSchema.docText : []
  };

  return <SchemaEditor initialSchema={schema} user={session.user} />;
}