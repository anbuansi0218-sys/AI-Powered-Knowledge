import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  cosineSimilarity,
  extractAnswerFromChunk,
  rankRelevantChunks
} from '../src/services/ragService.js';
import { evaluateArithmeticQuestion } from '../src/services/mathService.js';
import { generateAnswer, noDocumentAnswer } from '../src/services/llmService.js';
import { searchWeb } from '../src/services/webSearchService.js';

async function withInferenceServer(handler, callback) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previous = {
    hfToken: process.env.HF_TOKEN,
    legacyApiKey: process.env.QWEN_API_KEY,
    baseUrl: process.env.HF_INFERENCE_BASE_URL,
    model: process.env.HF_CHAT_MODEL
  };
  delete process.env.HF_TOKEN;
  process.env.QWEN_API_KEY = 'test-hf-api-token';
  process.env.HF_INFERENCE_BASE_URL = `http://127.0.0.1:${server.address().port}/v1`;
  process.env.HF_CHAT_MODEL = 'Qwen/Qwen3-8B:featherless-ai';

  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries({
      HF_TOKEN: previous.hfToken,
      QWEN_API_KEY: previous.legacyApiKey,
      HF_INFERENCE_BASE_URL: previous.baseUrl,
      HF_CHAT_MODEL: previous.model
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function readRequest(request) {
  return new Promise((resolve) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (part) => { body += part; });
    request.on('end', () => resolve(JSON.parse(body)));
  });
}

test('sends retrieved context to the configured Hugging Face Qwen model', async () => {
  let requestBody;
  let requestPath;
  let authorization;
  await withInferenceServer(async (request, response) => {
    requestPath = request.url;
    authorization = request.headers.authorization;
    requestBody = await readRequest(request);
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      choices: [{ message: { content: 'Answer from the document.' } }]
    }));
  }, async () => {
    const answer = await generateAnswer(
      'What is stated?',
      '[1] Guide\nThe guide says hello.',
      'Qwen/Qwen3-8B:featherless-ai',
      0.4
    );
    assert.equal(answer, 'Answer from the document.');
  });

  assert.equal(requestPath, '/v1/chat/completions');
  assert.equal(authorization, 'Bearer test-hf-api-token');
  assert.equal(requestBody.model, 'Qwen/Qwen3-8B:featherless-ai');
  assert.equal(requestBody.stream, false);
  assert.equal(requestBody.temperature, 0.4);
  assert.match(requestBody.messages[0].content, /only the supplied document context/i);
  assert.match(requestBody.messages[0].content, /question-and-answer pairs/i);
  assert.match(requestBody.messages[0].content, /NO_DOCUMENT_ANSWER/);
  assert.match(requestBody.messages[1].content, /The guide says hello/);
  assert.match(requestBody.messages[1].content, /What is stated/);
});

test('does not call Qwen when no document context was retrieved', async () => {
  assert.equal(
    await generateAnswer('Question without sources', '', 'Qwen/Qwen3-8B:featherless-ai', 0.2),
    noDocumentAnswer
  );
});

test('uses web-search instructions when generating an answer from search results', async () => {
  await withInferenceServer(async (request, response) => {
    const requestBody = await readRequest(request);
    assert.match(requestBody.messages[0].content, /only the supplied web search results/i);
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      choices: [{ message: { content: 'Answer from web sources.' } }]
    }));
  }, async () => {
    assert.equal(
      await generateAnswer('Question', '[1] Web source\nURL: https://example.com\nEvidence.', 'Qwen/Qwen3-8B:featherless-ai', 0.2, 'web'),
      'Answer from web sources.'
    );
  });
});

test('searches Tavily and returns only valid HTTPS sources', async () => {
  const previousKey = process.env.TAVILY_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.TAVILY_API_KEY = 'test-tavily-api-key';
  let requestUrl;
  let requestBody;
  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      answer: 'Tavily answer.',
      results: [
        { title: 'Search result', url: 'https://example.com/article', content: 'Useful evidence.' },
        { title: 'Unsafe result', url: 'javascript:alert(1)', content: 'Ignore this.' }
      ]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    assert.deepEqual(await searchWeb('What happened?'), {
      answer: 'Tavily answer.',
      results: [{
        title: 'Search result',
        url: 'https://example.com/article',
        content: 'Useful evidence.'
      }]
    });
    assert.equal(requestUrl, 'https://api.tavily.com/search');
    assert.equal(requestBody.query, 'What happened?');
    assert.equal(requestBody.include_answer, true);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = previousKey;
  }
});

test('returns a retryable rate-limit error for Qwen HTTP 429', async () => {
  await withInferenceServer((_request, response) => {
    response.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '5' });
    response.end(JSON.stringify({ error: { code: 'rate_limit_exceeded', message: 'Too many requests.' } }));
  }, async () => {
    await assert.rejects(
      generateAnswer('Question', 'Retrieved text.', 'Qwen/Qwen3-8B:featherless-ai', 0.2),
      (error) => error.status === 429 && /rate limit/i.test(error.message) && error.retryAfter === '5'
    );
  });
});

test('maps an inference-credit error to HTTP 402 for the chat web fallback', async () => {
  await withInferenceServer((_request, response) => {
    response.writeHead(402, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      error: { message: 'Purchase pre-paid credits to continue.' }
    }));
  }, async () => {
    await assert.rejects(
      generateAnswer('Question', 'Retrieved text.', 'Qwen/Qwen3-8B:featherless-ai', 0.2),
      (error) => error.status === 402 && /credits are unavailable/i.test(error.message)
    );
  });
});

test('maps token-limit errors to HTTP 413', async () => {
  await withInferenceServer((_request, response) => {
    response.writeHead(400, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      error: { code: 'context_length_exceeded', message: 'Input exceeds token limit.' }
    }));
  }, async () => {
    await assert.rejects(
      generateAnswer('Question', 'Retrieved text.', 'Qwen/Qwen3-8B:featherless-ai', 0.2),
      (error) => error.status === 413 && /token limit/i.test(error.message)
    );
  });
});

test('maps Hugging Face authentication errors to an actionable configuration message', async () => {
  await withInferenceServer((_request, response) => {
    response.writeHead(401, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: { message: 'Invalid API key.' } }));
  }, async () => {
    await assert.rejects(
      generateAnswer('Question', 'Retrieved text.', 'Qwen/Qwen3-8B:featherless-ai', 0.2),
      (error) => error.status === 502 &&
        /Hugging Face authentication or authorization failed/.test(error.message) &&
        /Inference Providers.*permission/i.test(error.message)
    );
  });
});

test('reports a missing Hugging Face token without making a request', async () => {
  const previousKey = process.env.QWEN_API_KEY;
  const previousToken = process.env.HF_TOKEN;
  delete process.env.QWEN_API_KEY;
  delete process.env.HF_TOKEN;
  try {
    await assert.rejects(
      generateAnswer('Question', 'Retrieved text.', 'Qwen/Qwen3-8B:featherless-ai', 0.2),
      (error) => error.status === 503 && /HF_TOKEN/.test(error.message)
    );
  } finally {
    if (previousKey !== undefined) process.env.QWEN_API_KEY = previousKey;
    if (previousToken !== undefined) process.env.HF_TOKEN = previousToken;
  }
});

test('cosine similarity handles matching and incompatible embedding dimensions', () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1], [1, 0]), 0);
});

test('ranks a document chunk containing the exact question above semantic-only matches', () => {
  const ranked = rankRelevantChunks('What is Python?', [
    { content: 'Python is a programming language.', score: 0.6 },
    { content: 'Question: What is Python? Answer: Python is a high-level programming language.', score: 0.2 }
  ]);

  assert.match(ranked[0].content, /Answer: Python is a high-level programming language/);
});

test('extracts an exact FAQ answer without including the next question', () => {
  assert.equal(
    extractAnswerFromChunk(
      'What is Python?',
      'Question: What is Python? Answer: Python is a high-level programming language. Q: What is Java? A: Java is another language.'
    ),
    'Python is a high-level programming language.'
  );
});

test('extracts a plain-text answer after an exact question', () => {
  assert.equal(
    extractAnswerFromChunk('What is Python?', 'What is Python? Python is a programming language.'),
    'Python is a programming language.'
  );
});

test('evaluates basic arithmetic questions without an AI model', () => {
  assert.equal(evaluateArithmeticQuestion('100+6'), '106');
  assert.equal(evaluateArithmeticQuestion('What is (10 + 2) * 3?'), '36');
  assert.equal(evaluateArithmeticQuestion('What is 100 plus 6?'), '106');
});

test('does not treat regular questions as arithmetic', () => {
  assert.equal(evaluateArithmeticQuestion('What is Python?'), null);
});

test('reports division by zero for arithmetic questions', () => {
  assert.equal(evaluateArithmeticQuestion('10 / 0'), 'Cannot divide by zero.');
});
