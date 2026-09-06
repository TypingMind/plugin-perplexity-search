const LEGACY_MODELS = {
  sonar: 'perplexity/sonar',
  'sonar-pro': 'perplexity/sonar',
  'sonar-reasoning': 'perplexity/sonar',
  'sonar-reasoning-pro': 'perplexity/sonar',
  'sonar-deep-research': 'perplexity/sonar',
};

function search_via_perplexity(params, userSettings) {
  const keyword = params.keyword;
  const model =
    LEGACY_MODELS[userSettings.model] ||
    userSettings.model ||
    'perplexity/sonar';
  const systemMessage = userSettings.systemMessage || 'Be precise and concise.';
  const key = userSettings.apiKey;
  const maxResults = Math.min(
    50,
    Math.max(1, parseInt(userSettings.maxResults) || 10),
  );

  if (!key) {
    throw new Error(
      'Please set the Perplexity API Key in the plugin settings.',
    );
  }

  return fetch('https://api.perplexity.ai/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: 'Bearer ' + key,
    },
    body: JSON.stringify({
      model: model,
      instructions: systemMessage,
      input: keyword,
      tools: [{ type: 'web_search', max_results: maxResults }],
      tool_choice: { type: 'web_search' },
    }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.text().then((err) => {
          throw new Error(
            `Perplexity API error (${res.status}). Details: ${err}`,
          );
        });
      }
      return res.json();
    })
    .then((response) => {
      if (response.status === 'failed' || response.status === 'cancelled') {
        const details =
          response.error?.message ||
          JSON.stringify(response.error) ||
          response.status;
        throw new Error(`Perplexity API error. Details: ${details}`);
      }

      const output = response.output || [];
      const content = output
        .filter((o) => o.type === 'message')
        .flatMap((o) => o.content || [])
        .filter((c) => c.type === 'output_text')
        .map((c) => c.text || '')
        .join('');
      const results = output
        .filter((o) => o.type === 'search_results')
        .flatMap((o) => o.results || [])
        .map((item) =>
          `Title: ${item.title}\nURL: ${item.url}\n${item.snippet || ''}`,
        )
        .join('\n\n');

      return [content, results].filter(Boolean).join('\n\n') || 'No results found.';
    });
}
