export const DEFAULT_CHAT_MODEL: string = 'chat-model';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'DeepSeek-V3',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'DeepSeek-R1',
  },
];
