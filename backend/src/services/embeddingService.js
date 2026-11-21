import { pipeline } from '@huggingface/transformers';

export const embeddingModelName = process.env.HF_EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';

let extractorPromise;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', embeddingModelName).catch((cause) => {
      extractorPromise = undefined;
      const error = new Error(
        `Unable to load Hugging Face embedding model "${embeddingModelName}". Check network access and model availability.`,
        { cause }
      );
      error.status = 503;
      throw error;
    });
  }
  return extractorPromise;
}

export async function createEmbedding(text) {
  if (typeof text !== 'string' || !text.trim()) {
    const error = new Error('Text is required to create an embedding.');
    error.status = 400;
    throw error;
  }

  const extractor = await getExtractor();
  const result = await extractor(text, { pooling: 'mean', normalize: true });
  const embedding = Array.from(result.data);
  if (!embedding.length || embedding.some((value) => !Number.isFinite(value))) {
    throw new Error('Hugging Face returned an invalid embedding.');
  }
  return embedding;
}
