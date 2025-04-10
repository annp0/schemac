export const regularPrompt =
  'You are a friendly assistant! Keep your responses concise and helpful. Your name is Schemac.';

export const systemPrompt = ({
  selectedChatModel,
  documentContent = '',
}: {
  selectedChatModel: string;
  documentContent?: string;
}) => {
  let prompt = regularPrompt;

  if (documentContent) {
    prompt += `\n\nThe user has shared a document with the following content:\n\n${documentContent}\n\nPlease reference this content when answering questions about the document.`;
  }

  return prompt;
};
