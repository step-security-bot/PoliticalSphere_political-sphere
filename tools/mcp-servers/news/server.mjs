import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 4020);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'news-mcp' });
});

app.get('/headlines', async (req, res) => {
  const category = req.query.category || 'politics';
  const country = req.query.country || 'gb'; // Default to UK

  try {
    // Using NewsAPI (free tier available)
    const endpoint = new URL('https://newsapi.org/v2/top-headlines');
    endpoint.searchParams.set('country', country);
    endpoint.searchParams.set('category', category);
    endpoint.searchParams.set('apiKey', process.env.NEWSAPI_KEY || 'demo');

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'political-sphere-mcp/1.0 (+https://github.com/)',
      },
    });

    if (!response.ok) {
      return res.status(502).json({
        error: 'News API request failed',
        status: response.status,
        statusText: response.statusText,
      });
    }

    const payload = await response.json();
    res.json({
      source: 'newsapi',
      category: category,
      country: country,
      articles: payload.articles?.slice(0, 10) || [], // Limit to 10 articles
      note: 'Current news headlines for political discourse simulation and public opinion modeling',
    });
  } catch (error) {
    console.error('News API error:', error);
    res.status(502).json({
      error: 'API error',
      details: String(error),
      fallback: {
        message: 'News API requires NEWSAPI_KEY environment variable',
        demo: true,
      },
    });
  }
});

app.listen(port, () => {
  console.log(
    `News MCP server listening on http://localhost:${port} — /health /headlines?category=politics&country=gb`
  );
});
