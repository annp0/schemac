import { notFound, redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { SchemaEditor } from '@/components/schema-editor';

export default async function NewSchemaPage() {
  // Authentication check
  const session = await auth();
  
  if (!session || !session.user) {
    return notFound();
  }
  
  // Create an empty schema structure for the editor
  const emptySchema = {
    id: '', // Will be generated on save
    name: '',
    description: '',
    userId: session.user.id,
    content: [],
    docText: [],
    createdAt: new Date()
  };

  return <SchemaEditor initialSchema={emptySchema} user={session.user} isNew={true} />;
}