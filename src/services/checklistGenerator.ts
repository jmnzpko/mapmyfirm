import { v4 as uuidv4 } from 'uuid';
import { SiteNode, GBPLocation, ChecklistItem, PracticeAreaPages } from '../types';
import { getDescendants, findNodeInList } from './treeBuilder';

// Practice area type definition
export type PracticeAreaType =
  | 'personal_injury'
  | 'car_accident'
  | 'motorcycle_accident'
  | 'pedestrian_accident'
  | 'slip_and_fall'
  | 'truck_accident'
  | 'rideshare_accident'
  | 'wrongful_death';

// Keywords for detecting each practice area
export const PRACTICE_AREA_KEYWORDS: Record<PracticeAreaType, string[]> = {
  personal_injury: [
    'personal injury',
    'injury law',
    'injury attorney',
    'injury lawyer',
    'bodily injury'
  ],
  car_accident: [
    'car accident',
    'auto accident',
    'vehicle accident',
    'motor vehicle',
    'automobile accident',
    'traffic accident'
  ],
  motorcycle_accident: [
    'motorcycle accident',
    'motorcycle crash',
    'motorcycle injury',
    'motorcycle collision',
    'bike accident',
    'biker accident'
  ],
  pedestrian_accident: [
    'pedestrian accident',
    'pedestrian injury',
    'pedestrian crash',
    'pedestrian collision',
    'hit by car',
    'struck pedestrian'
  ],
  slip_and_fall: [
    'slip and fall',
    'slip & fall',
    'trip and fall',
    'premises liability',
    'slip fall',
    'fall accident',
    'fall injury'
  ],
  truck_accident: [
    'truck accident',
    'truck crash',
    'truck collision',
    'semi truck',
    'commercial truck',
    'big rig',
    '18 wheeler',
    'tractor trailer'
  ],
  rideshare_accident: [
    'rideshare accident',
    'uber accident',
    'lyft accident',
    'rideshare crash',
    'ride share',
    'ridesharing accident'
  ],
  wrongful_death: [
    'wrongful death',
    'fatal accident',
    'death claim',
    'wrongful death claim',
    'wrongful death lawsuit'
  ]
};

// Display names for practice areas
export const PRACTICE_AREA_NAMES: Record<PracticeAreaType, string> = {
  personal_injury: 'Personal Injury',
  car_accident: 'Car Accident',
  motorcycle_accident: 'Motorcycle Accident',
  pedestrian_accident: 'Pedestrian Accident',
  slip_and_fall: 'Slip and Fall',
  truck_accident: 'Truck Accident',
  rideshare_accident: 'Rideshare Accident',
  wrongful_death: 'Wrongful Death'
};

/**
 * Check if text contains any of the keywords (case-insensitive)
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Find all practice area pages for a specific hub
 */
export function findPracticeAreaPages(
  hubId: string,
  nodes: SiteNode[]
): PracticeAreaPages {
  const hub = findNodeInList(nodes, hubId);

  const emptyResult: PracticeAreaPages = {
    personal_injury: { exists: false },
    car_accident: { exists: false },
    motorcycle_accident: { exists: false },
    pedestrian_accident: { exists: false },
    slip_and_fall: { exists: false },
    truck_accident: { exists: false },
    rideshare_accident: { exists: false },
    wrongful_death: { exists: false }
  };

  if (!hub) {
    return emptyResult;
  }

  // Get hub and all its descendants
  const relatedNodes = [hub, ...getDescendants(nodes, hubId)];

  // Search for each practice area
  const result: PracticeAreaPages = {} as PracticeAreaPages;

  (Object.keys(PRACTICE_AREA_KEYWORDS) as PracticeAreaType[]).forEach(areaType => {
    const keywords = PRACTICE_AREA_KEYWORDS[areaType];
    const page = relatedNodes.find(node =>
      containsKeywords(node.title, keywords) ||
      containsKeywords(node.slug, keywords)
    );

    result[areaType] = {
      exists: !!page,
      page_id: page?.id
    };
  });

  return result;
}

/**
 * Generate checklist from GBP locations and site nodes
 */
export function generateChecklist(
  gbpLocations: GBPLocation[],
  nodes: SiteNode[]
): ChecklistItem[] {
  return gbpLocations.map(location => {
    const hubExists = location.matched_hub_id !== null;

    const practiceAreas = location.matched_hub_id
      ? findPracticeAreaPages(location.matched_hub_id, nodes)
      : {
          personal_injury: { exists: false },
          car_accident: { exists: false },
          motorcycle_accident: { exists: false },
          pedestrian_accident: { exists: false },
          slip_and_fall: { exists: false },
          truck_accident: { exists: false },
          rideshare_accident: { exists: false },
          wrongful_death: { exists: false }
        };

    return {
      id: uuidv4(),
      location: location.location_string,
      hub_id: location.matched_hub_id,
      hub_exists: hubExists,
      practice_areas: practiceAreas,
      notes: '',
      completed: false,
      last_updated: new Date().toISOString()
    };
  });
}

/**
 * Calculate checklist completion statistics
 */
export function calculateChecklistStats(checklist: ChecklistItem[]) {
  const total = checklist.length;
  const completed = checklist.filter(item => item.completed).length;
  const hubsExist = checklist.filter(item => item.hub_exists).length;

  // Count each practice area
  const practiceAreaCounts: Record<PracticeAreaType, number> = {
    personal_injury: 0,
    car_accident: 0,
    motorcycle_accident: 0,
    pedestrian_accident: 0,
    slip_and_fall: 0,
    truck_accident: 0,
    rideshare_accident: 0,
    wrongful_death: 0
  };

  checklist.forEach(item => {
    (Object.keys(item.practice_areas) as PracticeAreaType[]).forEach(area => {
      if (item.practice_areas[area].exists) {
        practiceAreaCounts[area]++;
      }
    });
  });

  const totalPracticeAreas = Object.keys(PRACTICE_AREA_KEYWORDS).length;
  const totalRequired = total * (1 + totalPracticeAreas); // Hub + all practice areas per location
  const totalExists = hubsExist + Object.values(practiceAreaCounts).reduce((a, b) => a + b, 0);

  return {
    total,
    completed,
    completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    hubsExist,
    hubsPercentage: total > 0 ? Math.round((hubsExist / total) * 100) : 0,
    practiceAreaCounts,
    totalRequired,
    totalExists,
    overallPercentage: totalRequired > 0 ? Math.round((totalExists / totalRequired) * 100) : 0
  };
}

/**
 * Check if a specific practice area page exists for a location
 */
export function checkPageExists(
  hubId: string | null,
  nodes: SiteNode[],
  pageType: PracticeAreaType
): { exists: boolean; pageId?: string } {
  if (!hubId) {
    return { exists: false };
  }

  const keywords = PRACTICE_AREA_KEYWORDS[pageType];

  const hub = findNodeInList(nodes, hubId);
  if (!hub) {
    return { exists: false };
  }

  const relatedNodes = [hub, ...getDescendants(nodes, hubId)];

  const page = relatedNodes.find(node =>
    containsKeywords(node.title, keywords) ||
    containsKeywords(node.slug, keywords)
  );

  return {
    exists: !!page,
    pageId: page?.id
  };
}
