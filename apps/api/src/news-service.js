import { createLogger } from '@political-sphere/shared';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger({ name: 'news-service' });

/**
 * File-based storage adapter for NewsService
 */
class FileNewsStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.newsFile = path.join(dataDir, 'news.json');
  }

  async readAll() {
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

  async writeAll(items) {
    await fs.mkdir(this.dataDir, { recursive: true });
    const data = { news: items };
    await fs.writeFile(this.newsFile, JSON.stringify(data, null, 2));
  }
}

class NewsService {
  constructor(storeOrDataDir = path.join(moduleDir, '../../data'), timeProvider = null) {
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

  sanitizeTitle(title) {
    return title
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  generateSlug(title) {
    // First normalize the title
    const normalized = title
      .trim()
      .toLowerCase()
      // Replace HTML entities with their text equivalents for slug
      .replace(/&quot;/g, '-quot-')
      .replace(/&amp;/g, '-amp-')
      .replace(/&#x27;/g, '-x27-')
      .replace(/&lt;/g, '-lt-')
      .replace(/&gt;/g, '-gt-')
      // Replace other special characters
      .replace(/["'&<>]/g, char => {
        const map = { '&': '-amp-', '"': '-quot-', "'": '-x27-', '<': '-lt-', '>': '-gt-' };
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

  validateCategory(category) {
    if (!category || typeof category !== 'string') {
      const error = new Error('Category is required and must be a string');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    const normalized = category.toLowerCase();
    if (!this.validCategories.includes(normalized)) {
      const error = new Error(
        `Invalid category: ${category}. Must be one of: ${this.validCategories.join(', ')}`
      );
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    return normalized;
  }

  validateTags(tags) {
    if (!tags) return [];
    if (!Array.isArray(tags)) {
      const error = new Error('Tags must be an array');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (tags.length > 10) {
      const error = new Error('Too many tags: maximum 10 tags allowed');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.includes(' ')) {
        const error = new Error(`Invalid tag format: "${tag}". Tags must not contain spaces.`);
        error.code = 'VALIDATION_ERROR';
        throw error;
      }
    }
    return tags;
  }

  validateTitle(title) {
    if (!title || typeof title !== 'string') {
      const error = new Error('Title is required and must be a string');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      const error = new Error('Title cannot be empty');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (trimmed.length > 200) {
      const error = new Error('Title must be less than 200 characters');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    return trimmed;
  }

  validateSources(sources) {
    if (!sources) return [];
    if (!Array.isArray(sources)) {
      throw new Error('Sources must be an array');
    }
    return sources.map(url => {
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

  validateSearchQuery(query) {
    if (!query) return query;
    // Prevent XSS and SQL injection in search queries
    const dangerousPatterns = /<script|<iframe|javascript:|onerror=|'.*OR.*'|--|;/i;
    if (dangerousPatterns.test(query)) {
      const error = new Error('Invalid search query: potentially malicious content detected');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    return query;
  }

  async list(params = {}) {
    // Validate all parameters first before filtering
    if (params.category) {
      this.validateCategory(params.category); // Throws if invalid
    }
    if (params.tag) {
      // Validate tag format - must not contain HTML/scripts
      if (typeof params.tag !== 'string') {
        const error = new Error('Tag must be a string');
        error.code = 'VALIDATION_ERROR';
        throw error;
      }
      if (/<|>|script|iframe/i.test(params.tag)) {
        const error = new Error('Invalid tag format');
        error.code = 'VALIDATION_ERROR';
        throw error;
      }
    }
    if (params.search) {
      this.validateSearchQuery(params.search); // Throws if invalid
    }
    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      if (Number.isNaN(limit) || limit <= 0 || limit > this.maxLimit) {
        const error = new Error(`Invalid limit: must be between 1 and ${this.maxLimit}`);
        error.code = 'VALIDATION_ERROR';
        throw error;
      }
    }

    try {
      let news = await this.store.readAll();

      // Apply filters (validation already done above)
      if (params.category) {
        news = news.filter(item => item.category === params.category);
      }
      if (params.tag) {
        news = news.filter(item => item.tags?.includes(params.tag));
      }
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        news = news.filter(
          item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.content.toLowerCase().includes(searchTerm)
        );
      }

      // Apply limit
      if (params.limit) {
        const limit = parseInt(params.limit, 10);
        news = news.slice(0, limit);
      }

      return news;
    } catch (error) {
      // Re-throw validation errors
      if (error.code === 'VALIDATION_ERROR' || error.message.includes('Invalid')) {
        throw error;
      }
      logger.error({ msg: 'Error listing news', err: error });
      return [];
    }
  }

  async create(newsItem) {
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

      const newItem = {
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
      if (
        error.code === 'VALIDATION_ERROR' ||
        error.message.includes('Invalid') ||
        error.message.includes('Insecure') ||
        error.message.includes('must') ||
        error.message.includes('Too many')
      ) {
        // Ensure error has VALIDATION_ERROR code for server.ts to catch
        if (!error.code) {
          error.code = 'VALIDATION_ERROR';
        }
        throw error;
      }
      logger.error({ msg: 'Error creating news item', err: error });
      throw new Error('Failed to create news item');
    }
  }

  async update(id, updates) {
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
      };

      await this.store.writeAll(news);
      return news[index];
    } catch (error) {
      logger.error({ msg: 'Error updating news item', err: error, newsId: id });
      throw new Error('Failed to update news item');
    }
  }

  async getById(id) {
    try {
      const news = await this.store.readAll();
      return news.find(item => item.id === id) || null;
    } catch (error) {
      logger.error({ msg: 'Error getting news item', err: error, newsId: id });
      return null;
    }
  }

  async analyticsSummary() {
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

  groupBy(items, key) {
    return items.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  groupByTags(items) {
    const tagCounts = {};
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
export default { NewsService, FileNewsStore };
