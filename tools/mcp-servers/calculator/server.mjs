import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 4018);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'calculator-mcp' });
});

app.get('/calculate', (req, res) => {
  const expression = req.query.expr;
  if (typeof expression !== 'string' || expression.trim().length === 0) {
    return res.status(400).json({ error: 'expression parameter expr required' });
  }

  try {
    if (sanitized !== expression) {
      return res.status(400).json({
        error: 'Invalid characters in expression. Only numbers, +, -, *, /, (, ), . allowed',
      });
    }

    // Use Function constructor for safe evaluation (no eval)
    const result = new Function(`return ${sanitized}`)();

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return res.status(400).json({ error: 'Invalid mathematical expression' });
    }

    res.json({
      expression: expression,
      result: result,
      note: 'Useful for policy calculations, economic modeling, and statistical analysis',
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to evaluate expression',
      details: String(error),
    });
  }
});

app.listen(port, () => {
  console.log(
    `Calculator MCP server listening on http://localhost:${port} — /health /calculate?expr=...`
  );
});
