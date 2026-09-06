function search_via_perplexity(params, userSettings) {
  const keyword = params.keyword;
  const key = userSettings.apiKey;
  const maxResults = Math.min(
    20,
    Math.max(1, parseInt(userSettings.maxResults) || 10),
  );

  if (!key) {
    throw new Error(
      'Please set the Perplexity API Key in the plugin settings.',
    );
  }

  return fetch('https://api.perplexity.ai/search', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: 'Bearer ' + key,
    },
    body: JSON.stringify({
      query: keyword,
      max_results: maxResults,
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
      const items = response.results || [];
      if (!items.length) {
        return 'No results found.';
      }

      return items
        .map(
          (item) =>
            `Title: ${item.title}\nURL: ${item.url}\n${item.snippet || ''}`,
        )
        .join('\n\n');
    });
}
