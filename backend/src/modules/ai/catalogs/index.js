import { TECH_ROADMAPS } from './tech.catalog.js';
import { DOMAIN_ROADMAPS } from './domain.catalog.js';
import { classifyRoadmapTopic } from './classifier.js';
import {
  normalizeResource,
  normalizeRoadmapData,
  buildCustomRoadmap,
  extractJsonPayload
} from './normalizer.js';

export const FALLBACK_ROADMAPS = {
  ...TECH_ROADMAPS,
  ...DOMAIN_ROADMAPS
};

export {
  classifyRoadmapTopic,
  normalizeResource,
  normalizeRoadmapData,
  buildCustomRoadmap,
  extractJsonPayload
};

export default FALLBACK_ROADMAPS;
