import { WordPressPost, WordPressType, SiteNode } from '../types';

const WP_API_BASE = '/wp-json/wp/v2';

/**
 * Normalize URL - ensure it has protocol and no trailing slash
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//)) {
    normalized = 'https://' + normalized;
  }

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  return normalized;
}

/**
 * Fetch available content types from WordPress REST API
 */
export async function getContentTypes(siteUrl: string): Promise<WordPressType[]> {
  const url = normalizeUrl(siteUrl);

  const response = await fetch(`${url}${WP_API_BASE}/types`);

  if (!response.ok) {
    throw new Error(`Failed to fetch content types: ${response.statusText}`);
  }

  const typesData = await response.json();

  // Filter to only public, REST-enabled types
  const types: WordPressType[] = Object.values(typesData).filter(
    (type: any) => type.rest_base && type.slug !== 'attachment'
  );

  return types;
}

/**
 * Fetch a single page of posts for a given content type
 */
export async function fetchPostsPage(
  siteUrl: string,
  contentType: string,
  page: number = 1,
  perPage: number = 100
): Promise<{ posts: WordPressPost[]; totalPages: number; total: number }> {
  const url = normalizeUrl(siteUrl);
  const endpoint = `${url}${WP_API_BASE}/${contentType}`;

  const response = await fetch(
    `${endpoint}?per_page=${perPage}&page=${page}&_fields=id,title,slug,link,parent,type,status,modified,excerpt`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${contentType}: ${response.statusText}`);
  }

  const posts: WordPressPost[] = await response.json();

  // Get total pages from headers
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
  const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);

  return { posts, totalPages, total };
}

/**
 * Fetch all posts for a given content type (with pagination)
 */
export async function fetchAllPosts(
  siteUrl: string,
  contentType: string,
  onProgress?: (current: number, total: number) => void
): Promise<WordPressPost[]> {
  const allPosts: WordPressPost[] = [];
  let currentPage = 1;
  let totalPages = 1;

  // Fetch first page to get total
  const firstPage = await fetchPostsPage(siteUrl, contentType, 1);
  allPosts.push(...firstPage.posts);
  totalPages = firstPage.totalPages;

  if (onProgress) {
    onProgress(allPosts.length, firstPage.total);
  }

  // Fetch remaining pages
  while (currentPage < totalPages) {
    currentPage++;
    const pageData = await fetchPostsPage(siteUrl, contentType, currentPage);
    allPosts.push(...pageData.posts);

    if (onProgress) {
      onProgress(allPosts.length, firstPage.total);
    }
  }

  return allPosts;
}

/**
 * Transform WordPress post to SiteNode
 */
export function transformPostToNode(post: WordPressPost): SiteNode {
  return {
    id: post.id.toString(),
    title: post.title.rendered || '(No title)',
    slug: post.slug,
    url: post.link,
    parent_id: post.parent ? post.parent.toString() : null,
    type: post.type,
    status: post.status,
    manual_tags: [],
    date_modified: post.modified,
    content_excerpt: post.excerpt?.rendered || ''
  };
}

/**
 * Main scan function - fetch all content from WordPress site
 */
export async function scanWordPressSite(
  siteUrl: string,
  contentTypes: string[],
  onProgress?: (current: number, total: number, currentType: string) => void
): Promise<SiteNode[]> {
  const allNodes: SiteNode[] = [];

  for (const contentType of contentTypes) {
    const posts = await fetchAllPosts(
      siteUrl,
      contentType,
      (current, total) => {
        if (onProgress) {
          onProgress(current, total, contentType);
        }
      }
    );

    const nodes = posts.map(transformPostToNode);
    allNodes.push(...nodes);
  }

  return allNodes;
}

/**
 * Test if a WordPress site has REST API enabled
 */
export async function testWordPressAPI(siteUrl: string): Promise<boolean> {
  try {
    const url = normalizeUrl(siteUrl);
    const response = await fetch(`${url}${WP_API_BASE}`, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
