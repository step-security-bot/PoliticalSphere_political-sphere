import { createLogger } from '@political-sphere/shared';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger({ service: 'news-service' });

/**
 * Represents a news article stored by the `NewsService`.
 *
 * - `id`: unique slug/id for the item
 * - `title`: sanitized title shown to users
 * - `excerpt`: short summary (optional)
 * - `content`: full article body (optional)
 * - `category`: normalized category (must be one of service's valid categories)
 * - `tags`: short tag identifiers without spaces
 * - `sources`: trusted source URLs (HTTPS for external URLs)
 * - `createdAt` / `updatedAt`: ISO timestamp strings
 * - `status`: optional workflow status (e.g., `draft`, `published`)
 */
interface NewsItem {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  category: string;
  tags: string[];
  sources: string[];
  createdAt: string;
  updatedAt: string;
  status?: string;
}

/**
 * Parameters accepted by `NewsService.list` for filtering and paging.
 */
interface ListParams {
  category?: string;
  tag?: string;
  search?: string;
  limit?: number;
}

/**
 * Aggregated analytics summary returned by `NewsService.analyticsSummary()`.
 */
interface AnalyticsSummary {
  total: number;
  categories: Record<string, number>;
  tags: Record<string, number>;
  recent: NewsItem[];
}

/**
 * Minimal storage adapter interface used by `NewsService`.
 * Implementations must provide persisted `readAll` and `writeAll` operations.
 */
interface NewsStore {
  readAll(): Promise<NewsItem[]>;
  writeAll(items: NewsItem[]): Promise<void>;
}

/**
 * File-based storage adapter for NewsService
 */
/**
 * File-backed `NewsStore` implementation for simple persistence.
 * Uses a JSON file under the provided data directory. Intended for
 * development and lightweight production use where a full database is not
 * required. The format is `{ news: NewsItem[] }`.
 */
class FileNewsStore implements NewsStore {
  dataDir: string;
  newsFile: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.newsFile = path.join(dataDir, 'news.json');
  }

  async readAll(): Promise<NewsItem[]> {
    try {
      await fs.access(this.newsFile);
      const content = await fs.readFile(this.newsFile, 'utf8');
      const data = JSON.parse(content);
      return data.news || [];
    } catch {
      // If file doesn't exist, return empty array
      return [];
    }
  }

  async writeAll(items: NewsItem[]): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const data = { news: items };
    await fs.writeFile(this.newsFile, JSON.stringify(data, null, 2));
  }
}

/**
 * Service responsible for creating, validating, listing and summarising
 * news articles. The service is intentionally small and self-contained so
 * it can be swapped for a DB-backed implementation via the `NewsStore`
 * abstraction in tests and other environments.
 */
class NewsService {
  store: NewsStore;
  timeProvider: () => Date;
  validCategories: string[];
  maxLimit: number;

  constructor(
    storeOrDataDir: string | NewsStore = path.join(moduleDir, '../../data'),
    timeProvider: (() => Date) | null = null
  ) {
    // Support both store abstraction (for tests) and dataDir string (for production)
    if (typeof storeOrDataDir === 'string') {
      this.store = new FileNewsStore(storeOrDataDir);
    } else {
      this.store = storeOrDataDir;
    }
    this.timeProvider = timeProvider || (() => new Date());
    this.validCategories = ['politics', 'governance', 'policy', 'finance', 'technology', 'economy'];
    this.maxLimit = 1000;
  }

  /**
   * Clean and escape a title for safe display in HTML contexts.
   * Returns the escaped string.
   */
  sanitizeTitle(title: string): string {
    return title
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Generate a URL-friendly slug from a title. The slug is truncated to a
   * maximum length and appended with a short random suffix to avoid
   * collisions for identical titles.
   */
  generateSlug(title: string): string {
    // First normalize the title
    const normalized = title
      .trim()
      .toLowerCase()
      // Replace HTML entities with their text equivalents for slug
      .replace(/"/g, '-quot-')
      .replace(/&/g, '-amp-')
      .replace(/&#x27;/g, '-x27-')
      .replace(/</g, '-lt-')
      .replace(/>/g, '-gt-')
      // Replace other special characters
      .replace(/["'&<>]/g, char => {
        const map: Record<string, string> = {
          '&': '-amp-',
          '"': '-quot-',
          "'": '-x27-',
          '<': '-lt-',
          '>': '-gt-',
        };
        return map[char] || '';
      })
      // Convert spaces to hyphens
      .replace(/\s+/g, '-')
      // Remove any remaining non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    const random = Math.random().toString(36).substring(2, 8);
    return `${normalized}-${random}`;
  }

  /**
   * Validate that `category` is present and one of the allowed categories.
   * Throws an error with `code === 'VALIDATION_ERROR'` on failure.
   */
  validateCategory(category: string): string {
    if (!category || typeof category !== 'string') {
      const error = new Error('Category is required and must be a string');
      (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
      throw error;
    }
    const normalized = category.toLowerCase();
    if (!this.validCategories.includes(normalized)) {
      const error = new Error(
        `Invalid category: ${category}. Must be one of: ${this.validCategories.join(', ')}`
      );
      (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
      throw error;
    }
    return normalized;
  }

  /**
   * Validate tag list shape and content rules. Returns the normalized array
   * or throws on invalid input.
   */
  validateTags(tags: unknown): string[] {
    if (!tags) return [];
    if (!Array.isArray(tags)) {
      const error = new Error('Tags must be an array');
      (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
      throw error;
    }
    if (tags.length > 10) {
      const error = new Error('Too many tags: maximum 10 tags allowed');
      (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
      throw error;
    }
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.includes(' ')) {
        const error = new Error(`Invalid tag format: "${tag}". Tags must not contain spaces.`);
        (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
        throw error;
      }
    }
    return tags;
  }

  /**
   * Ensure a title is present and within length limits. Returns the trimmed
   * title or throws a validation error.
   */
  validateTitle(title: string): string {
    if (!title || typeof title !== 'string') {
      const error = new Error('Title is required and must be a string');
      (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
      throw error;
    }
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      const error = new Error('Title cannot be empty');
      (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
      throw error;
    }
    if (trimmed.length > 200) {
      const error = new Error('Title must be less than 200 characters');
      (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
      throw error;
    }
    return trimmed;
  }

  /**
   * Validate and normalise sources array. External URLs must use HTTPS.
   * Returns an array of trimmed URLs.
   */
  validateSources(sources: unknown): string[] {
    if (!sources) return [];
    if (!Array.isArray(sources)) {
      throw new Error('Sources must be an array');
    }
    return sources.map((url: string) => {
      const trimmed = url.trim();
      // Allow localhost for development/testing, but require https for external URLs
      if (trimmed.startsWith('http://localhost')) {
        return trimmed;
      }
      if (!trimmed.startsWith('https://')) {
        throw new Error(`Insecure source URL protocol: ${url}. External URLs must use HTTPS.`);
      }
      return trimmed;
    });
  }

  /**
   * Sanitize and validate a free-text search query to prevent obvious XSS
   * or injection patterns. Returns the original query when safe.
   */
  validateSearchQuery(query: string): string {
    if (!query) return query;
    // Prevent XSS and SQL injection in search queries
    const dangerousPatterns = /<script|<iframe|javascript:|onerror=|'.*OR.*'|--|;/i;
    if (dangerousPatterns.test(query)) {
      const error = new Error('Invalid search query: potentially malicious content detected');
      (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
      throw error;
    }
    return query;
  }

  /**
   * List news items with optional filtering and a result limit. Input
   * parameters are validated and will throw if malformed.
   *
   * @param params - Filter and pagination options
   * @returns Array of `NewsItem` matching the filters
   */
  async list(params: ListParams = {}): Promise<NewsItem[]> {
    // Validate all parameters first before filtering
    if (params.category) {
      this.validateCategory(params.category); // Throws if invalid
    }
    if (params.tag) {
      // Validate tag format - must not contain HTML/scripts
      if (typeof params.tag !== 'string') {
        const error = new Error('Tag must be a string');
        (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
        throw error;
      }
      if (/<|>|script|iframe/i.test(params.tag)) {
        const error = new Error('Invalid tag format');
        (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
        throw error;
      }
    }
    if (params.search) {
      this.validateSearchQuery(params.search); // Throws if invalid
    }
    if (params.limit) {
      const limit = parseInt(params.limit.toString(), 10);
      if (Number.isNaN(limit) || limit <= 0 || limit > this.maxLimit) {
        const error = new Error(`Invalid limit: must be between 1 and ${this.maxLimit}`);
        (error as unknown as { code?: string }).code = 'VALIDATION_ERROR';
        throw error;
      }
    }

    try {
      let news = await this.store.readAll();

      // Apply filters (validation already done above)
      if (params.category) {
        news = news.filter(item => item.category === params.category);
      }
      if (typeof params.tag === 'string') {
        const tag = params.tag;
        news = news.filter(item => (item.tags || []).includes(tag));
      }
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        news = news.filter(
          item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.content?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply limit
      if (params.limit) {
        const limit = parseInt(params.limit.toString(), 10);
        news = news.slice(0, limit);
      }

      return news;
    } catch (error) {
      // Re-throw validation errors
      const serr = error as unknown as { message?: string; code?: string };
      if (serr.code === 'VALIDATION_ERROR' || (serr.message ?? '').includes('Invalid')) {
        throw error;
      }
      logger.error({ msg: 'Error listing news', err: error });
      return [];
    }
  }

  /**
   * Create a new `NewsItem`. Validates input, sanitizes fields, persists the
   * item via the configured `NewsStore`, and returns the stored item.
   *
   * @param newsItem - Partial news payload (omits id and timestamps)
   * @returns Created `NewsItem` with `id`, `createdAt`, and `updatedAt`
   */
  async create(newsItem: Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsItem> {
    try {
      const news = await this.store.readAll();
      const now = this.timeProvider();

      // Validate and sanitize input (validate in order of specificity)
      const validatedTitle = this.validateTitle(newsItem.title);
      const tags = this.validateTags(newsItem.tags); // Check tags before category
      const category = this.validateCategory(newsItem.category);
      const sources = this.validateSources(newsItem.sources);
      const title = this.sanitizeTitle(validatedTitle);
      const id = this.generateSlug(validatedTitle);

      const newItem: NewsItem = {
        id,
        title,
        excerpt: newsItem.excerpt?.trim() || '',
        content: newsItem.content?.trim() || '',
        category,
        tags,
        sources,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      news.push(newItem);
      await this.store.writeAll(news);
      return newItem;
    } catch (error) {
      // Re-throw validation errors with proper code
      const serr = error as unknown as { message?: string; code?: string };
      if (
        serr.code === 'VALIDATION_ERROR' ||
        (serr.message ?? '').includes('Invalid') ||
        (serr.message ?? '').includes('Insecure') ||
        (serr.message ?? '').includes('must') ||
        (serr.message ?? '').includes('Too many')
      ) {
        // Ensure error has VALIDATION_ERROR code for server.ts to catch
        if (!serr.code) {
          serr.code = 'VALIDATION_ERROR';
        }
        throw error;
      }
      logger.error({ msg: 'Error creating news item', err: error });
      throw new Error('Failed to create news item');
    }
  }

  /**
   * Update an existing news item by `id`. Returns the updated item or `null`
   * if not found.
   */
  async update(id: string, updates: Partial<NewsItem>): Promise<NewsItem | null> {
    try {
      const news = await this.store.readAll();
      const index = news.findIndex(item => item.id === id);

      if (index === -1) {
        return null;
      }

      const now = this.timeProvider();
      news[index] = {
        ...news[index],
        ...updates,
        updatedAt: now.toISOString(),
      } as NewsItem;

      await this.store.writeAll(news);
      return news[index] as NewsItem;
    } catch (error) {
      logger.error({ msg: 'Error updating news item', err: error, newsId: id });
      throw new Error('Failed to update news item');
    }
  }

  /**
   * Retrieve a news item by its `id`, or `null` when not found.
   */
  async getById(id: string): Promise<NewsItem | null> {
    try {
      const news = await this.store.readAll();
      return news.find(item => item.id === id) || null;
    } catch (error) {
      logger.error({ msg: 'Error getting news item', err: error, newsId: id });
      return null;
    }
  }

  /**
   * Produce a compact analytics summary for published news items. The
   * returned structure contains counts per category and tag and a small
   * list of recent items.
   */
  async analyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const allNews = await this.store.readAll();

      // Filter to published items only and valid categories
      const news = allNews.filter(
        item =>
          item.status === 'published' && this.validCategories.includes(item.category?.toLowerCase())
      );

      // Sort by creation date descending (newest first)
      const sorted = news.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      return {
        total: news.length,
        categories: this.groupBy(news, 'category'),
        tags: this.groupByTags(news),
        recent: sorted.slice(0, 5),
      };
    } catch (error) {
      logger.error({ msg: 'Error getting analytics', err: error });
      return { total: 0, categories: {}, tags: {}, recent: [] };
    }
  }

  /**
   * Utility: group an array of items by a string key and return counts.
   */
  groupBy(items: NewsItem[], key: keyof NewsItem): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const value = item[key] as string;
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Utility: aggregate tag counts across a set of news items.
   */
  groupByTags(items: NewsItem[]): Record<string, number> {
    const tagCounts: Record<string, number> = {};
    items.forEach(item => {
      if (item.tags?.length) {
        item.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    return tagCounts;
  }
}

export { FileNewsStore, NewsService };
/**
 * Default export containing the `NewsService` class and the file-backed
 * `FileNewsStore` implementation. Import the class directly for typing
 * and tests (preferred), or use this default when a single object import
 * is more convenient in small scripts.
 */
export default { NewsService, FileNewsStore };
