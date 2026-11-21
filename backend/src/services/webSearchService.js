const tavilySearchUrl = 'https://api.tavily.com/search';

export async function searchWeb(question) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    const error = new Error('TAVILY_API_KEY is not configured in the backend .env file.');
    error.status = 503;
    throw error;
  }

  let response;
  try {
    response = await fetch(tavilySearchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        api_key: apiKey,
        query: question,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true
      })
    });
  } catch (cause) {
    const error = new Error('Could not connect to the Tavily web search API.', { cause });
    error.status = 503;
    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch (cause) {
    const error = new Error('Tavily returned an invalid response.', { cause });
    error.status = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(response.status === 401 || response.status === 403
      ? 'Tavily authentication failed. Check TAVILY_API_KEY.'
      : `Tavily web search failed with status ${response.status}.`);
    error.status = response.status === 429 ? 429 : 502;
    if (response.status === 429) error.retryAfter = response.headers.get('retry-after');
    throw error;
  }

  if (!Array.isArray(result.results)) {
    const error = new Error('Tavily returned an invalid search result list.');
    error.status = 502;
    throw error;
  }

  const results = result.results.flatMap((item) => {
    if (typeof item.title !== 'string' || typeof item.content !== 'string' || typeof item.url !== 'string') {
      return [];
    }
    try {
      const url = new URL(item.url);
      if (url.protocol !== 'https:') return [];
      return [{ title: item.title, url: url.href, content: item.content }];
    } catch {
      return [];
    }
  });
  return {
    answer: typeof result.answer === 'string' && result.answer.trim() ? result.answer.trim() : null,
    results
  };
}
