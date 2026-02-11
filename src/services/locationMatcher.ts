import Fuse from 'fuse.js';
import { v4 as uuidv4 } from 'uuid';
import { SiteNode, GBPLocation } from '../types';

/**
 * Normalize location string (trim, normalize spaces, consistent casing)
 */
export function normalizeLocationString(location: string): string {
  return location
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/,\s*/g, ', '); // Normalize comma spacing
}

/**
 * Parse location string into city and state
 */
export function parseLocation(location: string): { city: string; state: string } | null {
  const normalized = normalizeLocationString(location);
  const parts = normalized.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    return {
      city: parts[0],
      state: parts[1]
    };
  }

  return null;
}

/**
 * Filter nodes that are potential location hubs
 */
export function getHubNodes(nodes: SiteNode[], hubCptName?: string): SiteNode[] {
  return nodes.filter(node => {
    // Check manual tags first
    if (node.manual_tags.includes('Location Hub')) {
      return true;
    }

    // Check if node type matches hub CPT
    if (hubCptName && node.type === hubCptName) {
      return true;
    }

    // Check for common location indicators in type
    if (node.type === 'location' || node.type === 'office' || node.type === 'branch') {
      return true;
    }

    return false;
  });
}

/**
 * Calculate simple string similarity (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 80;

  // Use Levenshtein distance for more complex matching
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.max(0, similarity);
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Match GBP locations to hub nodes using fuzzy search
 */
export function matchLocations(
  gbpLocationStrings: string[],
  nodes: SiteNode[],
  hubCptName?: string
): GBPLocation[] {
  // Get potential hub nodes
  const hubNodes = getHubNodes(nodes, hubCptName);

  if (hubNodes.length === 0) {
    // No hubs found - return unmatched locations
    return gbpLocationStrings.map(locString => ({
      id: uuidv4(),
      location_string: normalizeLocationString(locString),
      matched_hub_id: null,
      confidence_score: 0,
      manual_override: false
    }));
  }

  // Configure Fuse.js for fuzzy matching
  const fuse = new Fuse(hubNodes, {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'slug', weight: 0.3 },
      { name: 'url', weight: 0.2 }
    ],
    threshold: 0.4, // 60% similarity required
    includeScore: true,
    ignoreLocation: true
  });

  // Match each GBP location
  return gbpLocationStrings.map(locString => {
    const normalized = normalizeLocationString(locString);
    const parsed = parseLocation(normalized);

    // Try to match using the city name if parsed
    const searchTerm = parsed ? parsed.city : normalized;

    const results = fuse.search(searchTerm);

    if (results.length > 0 && results[0].score !== undefined) {
      const bestMatch = results[0];
      const confidence = (1 - bestMatch.score) * 100;

      return {
        id: uuidv4(),
        location_string: normalized,
        matched_hub_id: bestMatch.item.id,
        confidence_score: Math.round(confidence),
        manual_override: false
      };
    }

    // No match found
    return {
      id: uuidv4(),
      location_string: normalized,
      matched_hub_id: null,
      confidence_score: 0,
      manual_override: false
    };
  });
}

/**
 * Find best matching hub for a single location
 */
export function findBestMatch(
  locationString: string,
  nodes: SiteNode[],
  hubCptName?: string
): { hubId: string | null; confidence: number } {
  const hubNodes = getHubNodes(nodes, hubCptName);

  if (hubNodes.length === 0) {
    return { hubId: null, confidence: 0 };
  }

  let bestHub: SiteNode | null = null;
  let bestScore = 0;

  const parsed = parseLocation(locationString);
  const searchTerm = parsed ? parsed.city : locationString;

  hubNodes.forEach(hub => {
    const titleScore = calculateSimilarity(searchTerm, hub.title);
    const slugScore = calculateSimilarity(searchTerm, hub.slug);

    const score = Math.max(titleScore, slugScore);

    if (score > bestScore) {
      bestScore = score;
      bestHub = hub;
    }
  });

  return {
    hubId: bestHub?.id || null,
    confidence: Math.round(bestScore)
  };
}
