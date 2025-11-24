// Local validation helpers (replacing missing ./shared-shim.js)
function isValidLength(value: string, min: number, max: number): boolean {
  const len = value.length;
  return Number.isFinite(min) && Number.isFinite(max) && len >= min && len <= max;
}

function isValidInput(value: string): boolean {
  // Basic guard against script tags and control chars (expand as needed)
  return !/[<>]/.test(value) && /^[\p{L}\p{N}\p{Z}\p{P}\p{S}]+$/u.test(value);
}

function isValidUrl(value: string, allowedProtocols: string[]): boolean {
  try {
    const u = new URL(value);
    const proto = u.protocol.replace(':', '');
    return (
      allowedProtocols.includes(proto) ||
      (proto === 'http' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1'))
    );
  } catch {
    return false;
  }
}

function sanitizeHtml(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/&/g, '&amp;');
}

const ALLOWED_CATEGORIES = [
  'politics',
  'economy',
  'social',
  'technology',
  'environment',
  'health',
  'finance',
  'governance',
  'policy',
  'general',
];
const MAX_TAGS = 10;
const MAX_SOURCES = 10;
const MAX_SOURCE_URL_LENGTH = 2048;
const ALLOWED_SOURCE_PROTOCOLS = ['https'];
const LOCALHOST_SOURCE_NAMES = ['localhost', '127.0.0.1'];

const DEFAULT_CATEGORY = 'general';

interface NewsValidationError extends Error {
  code: string;
  details?: unknown;
}

function createValidationError(message: string, details?: unknown): NewsValidationError {
  const error = new Error(message);
  (error as NewsValidationError).code = 'VALIDATION_ERROR';
  if (details !== undefined) {
    (error as NewsValidationError).details = details;
  }
  return error as NewsValidationError;
}

function assertPayloadObject(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createValidationError('Payload must be a JSON object', 'payload');
  }
}

function resolveCategory(category: unknown) {
  if (category === undefined || category === null || category === '') {
    return DEFAULT_CATEGORY;
  }
  const validated = validateCategory(String(category));
  if (!validated) {
    throw createValidationError(
      `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
      'category'
    );
  }
  return validated;
}

function validateTextField(fieldName: string, value: unknown, min: number, max: number) {
  if (typeof value !== 'string') {
    throw createValidationError(`${fieldName} must be a string`, fieldName.toLowerCase());
  }
  const trimmed = value.trim();
  if (!isValidLength(trimmed, min, max)) {
    throw createValidationError(
      `${fieldName} must be between ${min} and ${max} characters`,
      fieldName.toLowerCase()
    );
  }
  if (!isValidInput(trimmed)) {
    throw createValidationError(
      `${fieldName} contains invalid characters or patterns`,
      fieldName.toLowerCase()
    );
  }
  return trimmed;
}

function validateCategory(input: string): string | null {
  const normalized = String(input).trim().toLowerCase();
  return ALLOWED_CATEGORIES.includes(normalized) ? normalized : null;
}

function validateTag(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const t = input.trim().toLowerCase();
  return /^[a-z0-9-]{1,30}$/.test(t) ? t : null;
}

function sanitizeTagsInput(tags: unknown): string[] {
  if (tags === undefined || tags === null) {
    return [];
  }
  if (!Array.isArray(tags)) {
    throw createValidationError('Tags must be an array of strings', 'tags');
  }
  if ((tags as unknown[]).length > MAX_TAGS) {
    throw createValidationError(`Too many tags. Maximum allowed: ${MAX_TAGS}`, 'tags');
  }
  const sanitized: string[] = [];
  for (const tag of tags as unknown[]) {
    const validated = validateTag(tag);
    if (!validated) {
      throw createValidationError(`Invalid tag format: ${String(tag)}`, 'tags');
    }
    sanitized.push(validated);
  }
  return Array.from(new Set(sanitized));
}

function sanitizeSourcesInput(sources: unknown): string[] {
  if (sources === undefined || sources === null) {
    return [];
  }
  if (!Array.isArray(sources)) {
    throw createValidationError('Sources must be an array of URLs', 'sources');
  }
  if ((sources as unknown[]).length > MAX_SOURCES) {
    throw createValidationError(`Too many sources. Maximum allowed: ${MAX_SOURCES}`, 'sources');
  }

  const sanitized: string[] = [];
  for (const rawSource of sources as unknown[]) {
    if (typeof rawSource !== 'string') {
      throw createValidationError('Source URL must be a string', 'sources');
    }
    const candidate = rawSource.trim();
    if (!candidate) {
      continue;
    }
    if (candidate.length > MAX_SOURCE_URL_LENGTH) {
      throw createValidationError(
        `Source URL exceeds maximum length of ${MAX_SOURCE_URL_LENGTH} characters`,
        'sources'
      );
    }
    if (!isValidUrl(candidate, [...ALLOWED_SOURCE_PROTOCOLS, 'http'])) {
      throw createValidationError(`Invalid source URL: ${candidate}`, 'sources');
    }
    const parsed = new URL(candidate);
    const protocol = parsed.protocol.replace(':', '');
    if (!ALLOWED_SOURCE_PROTOCOLS.includes(protocol)) {
      if (!(protocol === 'http' && LOCALHOST_SOURCE_NAMES.includes(parsed.hostname))) {
        throw createValidationError(
          'Insecure source URL protocol. Use HTTPS or localhost for development-only sources',
          'sources'
        );
      }
    }
    sanitized.push(parsed.toString());
  }

  return Array.from(new Set(sanitized));
}

type NewsRecord = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  sources: string[];
  createdAt: string;
  updatedAt: string;
  status?: string;
};

type StoreLike = {
  read?: () => Promise<unknown[]>;
  getAll?: () => Promise<unknown[]>;
  readAll?: () => Promise<unknown[]>;
  write?: (items: unknown[]) => Promise<unknown>;
  save?: (items: unknown[]) => Promise<unknown>;
  writeAll?: (items: unknown[]) => Promise<unknown>;
  setAll?: (items: unknown[]) => Promise<unknown>;
};

class NewsService {
  private store: StoreLike | null;
  private nowFn: () => Date;

  constructor(store: StoreLike | null, nowFn: () => Date = () => new Date()) {
    this.store = store;
    this.nowFn = nowFn;
  }

  async _readItems(): Promise<unknown[]> {
    if (!this.store) return [];
    if (typeof this.store.read === 'function') return (await this.store.read()) || [];
    if (typeof this.store.getAll === 'function') return (await this.store.getAll()) || [];
    if (typeof this.store.readAll === 'function') return (await this.store.readAll()) || [];
    return [];
  }

  async _writeItems(items: unknown[]): Promise<unknown> {
    if (!this.store) throw new Error('No store configured');
    if (typeof this.store.write === 'function') return await this.store.write(items);
    if (typeof this.store.save === 'function') return await this.store.save(items);
    if (typeof this.store.writeAll === 'function') return await this.store.writeAll(items);
    if (typeof this.store.setAll === 'function') return await this.store.setAll(items);
    throw new Error('Store does not support write/save APIs');
  }

  _generateId(title = ''): string {
    const base =
      String(title || 'news')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'item';
    return `${base}-${Date.now().toString(36)}`;
  }

  _validateCreatePayload(payload: Partial<NewsRecord> = {}): void {
    const hasTitle = typeof payload.title === 'string' && payload.title.trim().length > 0;
    const hasExcerpt = typeof payload.excerpt === 'string' && payload.excerpt.trim().length > 0;
    const hasContent = typeof payload.content === 'string' && payload.content.trim().length > 0;
    if (!hasTitle || !hasExcerpt || !hasContent) {
      throw createValidationError('Missing required fields', 'payload');
    }
  }

  // further structural and content validations are handled in create() to allow
  // sanitization and normalization prior to persistence

  async create(payload: Partial<NewsRecord> = {}) {
    this._validateCreatePayload(payload);
    // enforce stricter validations and sanitize inputs
    assertPayloadObject(payload);

    // title/excerpt/content
    const title = sanitizeHtml(validateTextField('Title', payload.title, 1, 200));
    const excerpt = sanitizeHtml(validateTextField('Excerpt', payload.excerpt, 1, 1000));
    const content = sanitizeHtml(validateTextField('Content', payload.content, 1, 20000));

    // category
    const category = resolveCategory(payload.category);

    // tags
    const tags = sanitizeTagsInput(payload.tags);

    // sources
    const sources = sanitizeSourcesInput(payload.sources);
    const items = ((await this._readItems()) || []) as NewsRecord[];
    const nowIso = this.nowFn().toISOString();

    const record: NewsRecord = {
      id: payload.id || this._generateId(title),
      title,
      excerpt,
      content,
      category,
      tags,
      sources,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    items.push(record);
    await this._writeItems(items);
    return record;
  }

  async list(opts: Partial<{ category: string; tag: string; search: string; limit: number }> = {}) {
    const { category, tag, search, limit } = opts || {};
    let items = ((await this._readItems()) || []) as unknown[] as Array<Partial<NewsRecord>>;

    if (category) {
      // validate category
      resolveCategory(category);
      items = items.filter(i => i.category === category);
    }

    if (tag) {
      // validate tag format
      const validatedTag = validateTag(tag);
      if (!validatedTag) throw createValidationError('Invalid tag', 'tag');
      items = items.filter(i => Array.isArray(i.tags) && i.tags.includes(validatedTag));
    }

    if (search) {
      // validate search input to avoid basic XSS/SQL patterns
      if (!isValidInput(search)) {
        throw createValidationError('Invalid search query', 'search');
      }
      const q = String(search).toLowerCase();
      items = items.filter(
        i =>
          i.title?.toLowerCase().includes(q) ||
          i.excerpt?.toLowerCase().includes(q) ||
          i.content?.toLowerCase().includes(q)
      );
    }

    if (limit !== undefined) {
      const n = Number(limit);
      if (!Number.isFinite(n) || n < 0 || n > 1000) {
        throw createValidationError('Invalid limit', 'limit');
      }
      items = items.slice(0, n);
    }

    return items;
  }

  async update(id: string, changes: Partial<NewsRecord> = {}) {
    if (!id) return null;
    const items = ((await this._readItems()) || []) as NewsRecord[];
    const idx = items.findIndex(it => it.id === id);
    if (idx === -1) return null;
    const existing = items[idx];
    if (!existing) return null;
    const updated: NewsRecord = {
      ...existing,
      ...changes,
      id: existing.id,
      updatedAt: this.nowFn().toISOString(),
    };
    items[idx] = updated;
    await this._writeItems(items);
    return updated;
  }

  async analyticsSummary(): Promise<{
    total: number;
    categories: Record<string, number>;
    recent: NewsRecord[];
  }> {
    const items = ((await this._readItems()) || []) as NewsRecord[];
    const validItems = items.filter(item => {
      if (!item || typeof item !== 'object') return false;
      // Only count published items; skip drafts or malformed entries from legacy data
      if ((item as NewsRecord).status !== 'published') return false;
      try {
        resolveCategory(item.category);
      } catch {
        return false;
      }
      return true;
    });
    const total = validItems.length;
    const categories = validItems.reduce(
      (acc, it) => {
        const category = resolveCategory(it.category);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const recent = validItems
      .slice()
      .filter(i => {
        if (!i.createdAt) return false;
        const timestamp = new Date(i.createdAt).getTime();
        return Number.isFinite(timestamp);
      })
      .sort(
        (a, b) =>
          new Date((b as NewsRecord).createdAt).getTime() -
          new Date((a as NewsRecord).createdAt).getTime()
      );
    return { total, categories, recent };
  }
}

export { NewsService };
/**
 * Default module export containing `NewsService`. Import the named
 * export for type-safety (`import { NewsService } from '.../news-service'`),
 * or use the default export for quick access in scripts.
 */
export default { NewsService };
