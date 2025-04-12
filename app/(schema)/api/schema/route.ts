import { auth } from '@/app/(auth)/auth';
import {
  createSchema,
  getSchemasByUserId,
  updateSchema,
  deleteSchemaById
} from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const {
      name,
      description,
      content,
      docText
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!name || !content || !Array.isArray(content)) {
      return new Response('Missing required fields', { status: 400 });
    }

    await createSchema({
      name,
      description,
      userId: session.user.id,
      content,
      docText
    });

    return new Response('Schema created successfully', { status: 201 });
  } catch (error) {
    console.error('Error creating schema:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const schemas = await getSchemasByUserId({ userId: session.user.id });

    return new Response(JSON.stringify(schemas), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching schemas:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const {
      id,
      name,
      description,
      content,
      docText
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!id) {
      return new Response('Schema ID is required', { status: 400 });
    }

    await updateSchema({
      id,
      name,
      description,
      content,
      docText
    });

    return new Response('Schema updated successfully', { status: 200 });
  } catch (error) {
    console.error('Error updating schema:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Schema ID is required', { status: 400 });
    }

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteSchemaById({ id });

    return new Response('Schema deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting schema:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}