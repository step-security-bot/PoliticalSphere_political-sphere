import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 4017);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'weather-mcp' });
});

app.get('/weather', async (req, res) => {
  const location = req.query.location;
  if (typeof location !== 'string' || location.trim().length === 0) {
    return res.status(400).json({ error: 'location parameter required' });
  }

  try {
    // Using Open-Meteo API (free, no API key required)
    const endpoint = new URL('https://api.open-meteo.com/v1/forecast');
    endpoint.searchParams.set('latitude', '51.5074'); // Default to London for UK focus
    endpoint.searchParams.set('longitude', '-0.1278');
    endpoint.searchParams.set('current_weather', 'true');
    endpoint.searchParams.set('hourly', 'temperature_2m,precipitation,rain,snowfall');
    endpoint.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum');
    endpoint.searchParams.set('timezone', 'Europe/London');

    const response = await fetch(endpoint);

    if (!response.ok) {
      return res.status(502).json({
        error: 'Weather API request failed',
        status: response.status,
        statusText: response.statusText,
      });
    }

    const payload = await response.json();
    res.json({
      source: 'open-meteo',
      location: location,
      data: payload,
      note: 'Data useful for climate policy simulation and environmental impact assessment',
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(502).json({ error: 'API error', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(
    `Weather MCP server listening on http://localhost:${port} — /health /weather?location=...`
  );
});
