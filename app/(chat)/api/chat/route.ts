import {
  UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  updateOrCreateAttachedText,
  getAttachedTextByChatId,
  getSchemaById,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { Document } from "langchain/document";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { UserSchema } from '@/lib/db/schema';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
      selectedSchemaIds,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
      selectedSchemaIds: Array<string>;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    let documentContent = '';

    const newMessage = messages[messages.length - 1];

    if (newMessage.experimental_attachments && newMessage.experimental_attachments.length > 0) {

      const attachments = newMessage.experimental_attachments;
      const resPromises = attachments.map((attachment) => fetch(attachment.url));
      const responses = await Promise.all(resPromises);

      // Filter PDFs
      const bufPromises = responses.filter((response) => {
        return response.headers.get('content-type') === 'application/pdf';
      }).map((response) => response.arrayBuffer());

      // Filter ALL text files (not just plain text)
      const txtPromises = responses.filter((response) => {
        const contentType = response.headers.get('content-type');
        return contentType?.startsWith('text/'); // Accept any text/* MIME type
      }).map((response) => response.text());

      const buffers = await Promise.all(bufPromises);
      const textContents = await Promise.all(txtPromises);
      const blobs = buffers.map((buffer) => new Blob([buffer]));

      // Now process the extracted content and enhance your system prompt
      if (textContents.length > 0) {
        documentContent += textContents.join('\n\n');
      }

      if (blobs.length > 0) {
        const docPromises = blobs.map((blob) => new PDFLoader(blob).load())
        const docs = await Promise.all(docPromises);
        const text = docs.map((doc) => doc.map((d: Document) => d.pageContent).join('\n\n')).join('\n\n');
        documentContent += text;
      }

      await updateOrCreateAttachedText({
        chatId: id,
        content: documentContent,
      });
    }

    const attachedTexts = await getAttachedTextByChatId({ chatId: id });

    // Combine all attached text content for the system prompt
    const completeDocumentContent = attachedTexts
      .map(text => text.content)
      .join('\n\n');

    let schemaDetails: UserSchema[] = [];

    if (selectedSchemaIds && selectedSchemaIds.length > 0) {
      // Fetch schema details from the database
      const rawSchemas = await Promise.all(
        selectedSchemaIds.map(async (schemaId: string) => {
          // Use your existing query function to get schema details
          return await getSchemaById({ id: schemaId });
        })
      );

      // Transform the raw schemas to match UserSchema type
      schemaDetails = rawSchemas.map(schema => ({
        ...schema,
        content: Array.isArray(schema.content) ? schema.content : [],
        docText: Array.isArray(schema.docText) ? schema.docText : []
      })) as UserSchema[];
    }

    let schemaContext = '';

    schemaDetails.forEach((schema) => {
      schemaContext += `\n\nSchema Name: ${schema.name}\n\n`;
      schemaContext += `Schema Content: ${JSON.stringify(schema.content)}\n\n`;
      schemaContext += `Schema Description: ${schema.description}\n\n`;
      schemaContext += `Schema DocText: ${JSON.stringify(schema.docText)}\n\n`;
    })

    //console.log('Schema Context:', schemaContext);
    //console.log('WHAT????!!!')

    const enhancedSystemPrompt = systemPrompt({
      selectedChatModel,
      documentContent: completeDocumentContent,
      schemaContext: schemaContext,
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        console.log(myProvider.languageModel(selectedChatModel))
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: enhancedSystemPrompt,
          messages,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
