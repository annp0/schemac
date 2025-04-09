import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createAzure } from '@quail-ai/azure-ai-provider';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Initialize Azure provider
const azure = createAzure({
  apiKey: process.env.AZURE_API_KEY,
  endpoint: process.env.AZURE_API_ENDPOINT,
});

export const myProvider = isTestEnvironment
  ? customProvider({
    languageModels: {
      'chat-model': chatModel,
      'chat-model-reasoning': reasoningModel,
      'title-model': titleModel,
      'artifact-model': artifactModel,
    },
  })
  : customProvider({
    languageModels: {
      'chat-model': azure('DeepSeek-V3'),
      'chat-model-reasoning': wrapLanguageModel({
        model: azure('DeepSeek-R1'),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),
      'title-model': azure('DeepSeek-V3'),
      'artifact-model': azure('DeepSeek-V3'),
    },
  });