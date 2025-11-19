import { NewsService } from './news-service';
import { JsonNewsStore } from './stores/news-store';

interface ServerOptions {}

function createNewsServer(options: ServerOptions = {}): {
  newsService: NewsService;
  newsStore: JsonNewsStore;
} {
  const newsService = new NewsService();
  const newsStore = new JsonNewsStore();

  return {
    newsService,
    newsStore,
  };
}

export { createNewsServer };
