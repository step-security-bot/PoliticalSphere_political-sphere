/**
 * HTTP utility functions for request/response handling
 *
 * ESM Module - Converted from CommonJS 2025-11-11
 */

const DEFAULT_MAX_JSON_BYTES = 1024 * 1024; // 1 MiB
const DEFAULT_ALLOWED_CONTENT_TYPES = ['application/json', 'application/merge-patch+json'];

function isAllowedJsonContentType(contentType, allowedTypes) {
  return allowedTypes.some(type => contentType.startsWith(type));
}

/**
 * Read and parse a JSON request body with size, content-type and timeout enforcement.
 * @param {import('http').IncomingMessage} req
 * @param {{limit?: number, allowedContentTypes?: string[], timeoutMs?: number}} options
 * @returns {Promise<object|undefined>}
 */
export async function readJsonBody(req, options = {}) {
  const {
    limit = DEFAULT_MAX_JSON_BYTES,
    allowedContentTypes = DEFAULT_ALLOWED_CONTENT_TYPES,
    timeoutMs = 10000, // default 10s fail‑closed timeout
  } = options;

  const contentTypeHeader = req.headers['content-type'];
  if (
    contentTypeHeader &&
    typeof contentTypeHeader === 'string' &&
    !isAllowedJsonContentType(contentTypeHeader.toLowerCase(), allowedContentTypes)
  ) {
    const unsupported = new Error('Unsupported content type');
    unsupported.code = 'UNSUPPORTED_MEDIA_TYPE';
    throw unsupported;
  }

  const chunks = [];
  let totalLength = 0;

  const bodyPromise = (async () => {
    for await (const chunk of req) {
      totalLength += chunk.length;
      if (totalLength > limit) {
        const tooLarge = new Error('Request entity too large');
        tooLarge.code = 'PAYLOAD_TOO_LARGE';
        throw tooLarge;
      }
      chunks.push(chunk);
    }
    return chunks;
  })();

  // Fail closed if body streaming exceeds timeout (security: prevent resource exhaustion)
  const timeoutPromise = new Promise((_, reject) => {
    const id = setTimeout(() => {
      const err = new Error('Request body timeout');
      err.code = 'BODY_TIMEOUT';
      reject(err);
    }, timeoutMs);
    // Clear timeout on end/error
    req.on('end', () => clearTimeout(id));
    req.on('error', () => clearTimeout(id));
    req.on('close', () => clearTimeout(id));
    req.on('aborted', () => clearTimeout(id));
  });

  const streamedChunks = await Promise.race([bodyPromise, timeoutPromise]);

  if (!Array.isArray(streamedChunks)) {
    // In race scenario streamedChunks could be undefined if timeout fired first
    if (chunks.length === 0) return {};
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const parseError = new Error('Invalid JSON payload');
    parseError.code = 'INVALID_JSON';
    throw parseError;
  }
}

export function sendJson(res, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

export function sendError(res, statusCode, message, details, headers = {}) {
  sendJson(
    res,
    statusCode,
    {
      error: message,
      details,
    },
    {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...headers,
    }
  );
}

export function notFound(res, path) {
  sendError(res, 404, `Route ${path} not found`);
}

export function methodNotAllowed(res) {
  sendError(res, 405, 'Method not allowed');
}
