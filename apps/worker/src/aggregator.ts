export interface NewsItem {
  id?: string;
  title?: string;
  category?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface Summary {
  total: number;
  categories: Record<string, number>;
  tags: Record<string, number>;
  latest: { id: string; title: string; updatedAt: string } | null;
  generatedAt: string;
}

export function summarizeNews(items: NewsItem[]): Summary {
  const safeItems = Array.isArray(items) ? items : [];

  const categories: Record<string, number> = {};
  const tags: Record<string, number> = {};

  for (const item of safeItems) {
    const category = item?.category ?? 'general';
    categories[category] = (categories[category] ?? 0) + 1;

    if (Array.isArray(item?.tags)) {
      for (const tag of item.tags) {
        if (!tag) continue;
        tags[tag] = (tags[tag] ?? 0) + 1;
      }
    }
  }

  const latest =
    [...safeItems]
      .filter(item => Boolean(item?.updatedAt))
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())[0] ??
    null;

  return {
    total: safeItems.length,
    categories,
    tags,
    latest: latest ? { id: latest.id!, title: latest.title!, updatedAt: latest.updatedAt! } : null,
    generatedAt: new Date().toISOString(),
  };
}
