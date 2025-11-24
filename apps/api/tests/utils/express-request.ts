import http, { type OutgoingHttpHeaders } from 'node:http';
import { Duplex } from 'node:stream';
import type { Socket } from 'node:net';
import type { Application, Request, Response } from 'express';

class MockSocket extends Duplex {
  private chunks: Buffer[];

  constructor() {
    super({ allowHalfOpen: true });
    this.chunks = [];
  }

  override _read(): void {}

  override _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
    this.chunks.push(buffer);
    callback();
  }

  get data(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

function createReqRes({
  method,
  url,
  headers,
}: {
  method: string;
  url: string;
  headers: { accept?: string } & Record<string, string>;
}): {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  socket: MockSocket;
} {
  const socket = new MockSocket();
  const req = new http.IncomingMessage(socket as unknown as Socket);
  req.method = method;
  req.url = url;
  req.headers = {
    host: 'localhost',
    ...headers,
  };

  const res = new http.ServerResponse(req);
  res.assignSocket(socket as unknown as Socket);

  return { req, res, socket };
}

function normalizeBody(body: unknown): string | undefined {
  if (body === undefined) {
    return undefined;
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body);
}

/**
 * Dispatch an HTTP request against an Express `Application` instance for tests.
 *
 * This helper constructs Node `IncomingMessage` and `ServerResponse` objects backed
 * by an in-memory socket, invokes the provided `app`, and collects the response
 * body and headers once the response finishes. It supports sending a request
 * body (JSON by default) and custom headers. Designed for use in unit and
 * integration tests where starting a real HTTP server is undesirable.
 *
 * @param app - Express application instance to invoke
 * @param options.method - HTTP method to use (default: `GET`)
 * @param options.url - Request URL/path (default: `/`)
 * @param options.body - Optional request body. Objects will be serialized to JSON
 * @param options.headers - Optional headers to include on the request
 * @returns A promise that resolves with `{ status, headers, body, text }` where
 * `body` is parsed JSON when possible and `text` is the raw response payload.
 */
export async function dispatchRequest(
  app: Application,
  {
    method = 'GET',
    url = '/',
    body,
    headers = {},
  }: {
    method?: string;
    url?: string;
    body?: unknown;
    headers?: { accept?: string } & Record<string, string>;
  }
): Promise<{
  status: number;
  headers: OutgoingHttpHeaders;
  body: unknown;
  text: string;
}> {
  const hasBody = body !== undefined;
  const normalizedHeaders: { accept?: string } & Record<string, string> = { ...headers };
  const serializedBody = normalizeBody(body);

  if (hasBody && !normalizedHeaders['content-type']) {
    normalizedHeaders['content-type'] = 'application/json';
  }

  const { req, res, socket } = createReqRes({ method, url, headers: normalizedHeaders });

  const wantsPlainText =
    (headers.accept || normalizedHeaders.accept || '').toLowerCase() === 'text/plain';

  return await new Promise((resolve, reject) => {
    let settled = false;

    const finalize = (error: Error | null | undefined): void => {
      if (settled) return;
      settled = true;

      if (error) {
        reject(error);
        return;
      }

      const raw = socket.data.toString();
      const separator = raw.indexOf('\r\n\r\n');
      const bodyText = separator >= 0 ? raw.slice(separator + 4) : '';
      let parsed: unknown = bodyText;

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

    const originalEnd = res.end;
    res.end = ((...args: Parameters<typeof res.end>) => {
      const result = originalEnd.apply(res, args);
      // Wait for 'finish' event to ensure all response data is written before finalizing.
      // This avoids race conditions where response data may not be fully flushed to the socket.
      // Trade-off: If 'finish' is never emitted, the test may hang. This is preferable to reading incomplete data.
      res.once('finish', () => finalize(null));
      return result;
    }) as typeof res.end;

    res.on('error', (error: Error) => finalize(error));
    socket.on('error', (error: Error) => finalize(error));

    if (hasBody && serializedBody !== undefined) {
      let parsedBody = body;
      if (typeof body === 'string') {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = body;
        }
      }
      (req as http.IncomingMessage & { body: unknown; _body: boolean }).body = parsedBody;
      (req as http.IncomingMessage & { body: unknown; _body: boolean })._body = true;
      if (!req.headers['content-length']) {
        req.headers['content-length'] = Buffer.byteLength(serializedBody).toString();
      }
      req.push(Buffer.from(serializedBody));
    }
    req.push(null);

    app(req as unknown as Request, res as unknown as Response, (err?: unknown) => {
      if (err) {
        finalize(err as Error);
        return;
      }
      if (!res.writableEnded) {
        queueMicrotask(() => finalize(null));
      }
    });
  });
}
