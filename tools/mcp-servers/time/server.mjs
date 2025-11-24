import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 4019);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'time-mcp' });
});

app.get('/now', (_req, res) => {
  const now = new Date();
  res.json({
    utc: now.toISOString(),
    local: now.toLocaleString('en-GB', { timeZone: 'Europe/London' }),
    timestamp: now.getTime(),
    note: 'Current time for political event scheduling and temporal policy simulations',
  });
});

app.get('/format', (req, res) => {
  const timestamp = req.query.timestamp;
  if (typeof timestamp !== 'string' && typeof timestamp !== 'number') {
    return res.status(400).json({ error: 'timestamp parameter required' });
  }

  try {
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid timestamp' });
    }

    res.json({
      timestamp: date.getTime(),
      utc: date.toISOString(),
      local: date.toLocaleString('en-GB', { timeZone: 'Europe/London' }),
      relative: getRelativeTime(date),
      note: 'Time formatting for policy timelines and historical event analysis',
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to format timestamp',
      details: String(error),
    });
  }
});

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 0) return `${diffDays} days ago`;
  return `In ${Math.abs(diffDays)} days`;
}

app.listen(port, () => {
  console.log(
    `Time MCP server listening on http://localhost:${port} — /health /now /format?timestamp=...`
  );
});
