import http from 'node:http';
import { Duplex } from 'node:stream';

class MockSocket extends Duplex {
  constructor() {
    super({ allowHalfOpen: true });
    this.chunks = [];
  }

  _read() {}

  _write(chunk, encoding, callback) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
    this.chunks.push(buffer);
    callback();
  }

  get data() {
    return Buffer.concat(this.chunks);
  }
}

function createReqRes({ method, url, headers }) {
  const socket = new MockSocket();
  const req = new http.IncomingMessage(socket);
  req.method = method;
  req.url = url;
  req.headers = {
    host: 'localhost',
    ...headers,
  };

  const res = new http.ServerResponse(req);
  res.assignSocket(socket);

  return { req, res, socket };
}

function normalizeBody(body) {
  if (body === undefined) {
    return undefined;
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body);
}

export async function dispatchRequest(app, { method = 'GET', url = '/', body, headers = {} }) {
  const hasBody = body !== undefined;
  const normalizedHeaders = { ...headers };
  const serializedBody = normalizeBody(body);

  if (hasBody && !normalizedHeaders['content-type']) {
    normalizedHeaders['content-type'] = 'application/json';
  }

  const { req, res, socket } = createReqRes({ method, url, headers: normalizedHeaders });

  const wantsPlainText =
    (headers['accept'] || normalizedHeaders['accept'] || '').toLowerCase() === 'text/plain';

  return await new Promise((resolve, reject) => {
    let settled = false;

    const finalize = error => {
      if (settled) return;
      settled = true;

      if (error) {
        reject(error);
        return;
      }

      const raw = socket.data.toString();
      const separator = raw.indexOf('\r\n\r\n');
      const bodyText = separator >= 0 ? raw.slice(separator + 4) : '';
      let parsed = bodyText;

      if (!wantsPlainText) {
        try {
          parsed = bodyText ? JSON.parse(bodyText) : {};
        } catch {
          // Keep original text when JSON parsing fails
        }
      }

      resolve({
        status: res.statusCode ?? 0,
        headers: res.getHeaders(),
        body: parsed,
        text: bodyText,
      });
    };

    const originalEnd = res.end.bind(res);
    res.end = (...args) => {
      const result = originalEnd(...args);
      // Wait for socket to finish writing before reading data
      socket.once('finish', () => {
        // Give socket time to flush all chunks
        setImmediate(() => finalize());
      });
      return result;
    };

    res.on('error', finalize);
    socket.on('error', finalize);

    if (hasBody && serializedBody !== undefined) {
      let parsedBody = body;
      if (typeof body === 'string') {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = body;
        }
      }
      req.body = parsedBody;
      req._body = true;
      req.headers['content-length'] =
        req.headers['content-length'] || Buffer.byteLength(serializedBody).toString();
      req.push(Buffer.from(serializedBody));
    }
    req.push(null);

    app.handle(req, res, err => {
      if (err) {
        finalize(err);
        return;
      }
      if (!res.writableEnded) {
        queueMicrotask(() => finalize());
      }
    });
  });
}
