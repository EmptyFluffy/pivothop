import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const SCRAPER_ROOT = path.resolve(here, '..', '..');
export const REPO_ROOT = path.resolve(SCRAPER_ROOT, '..', '..');
export const DATA_DIR = path.join(SCRAPER_ROOT, 'data');
export const CACHE_DIR = path.join(SCRAPER_ROOT, 'cache');
export const CONFIG_DIR = path.join(SCRAPER_ROOT, 'config');
export const PKG_DATA = path.join(REPO_ROOT, 'packages', 'data');
export const TAXONOMY_DIR = path.join(PKG_DATA, 'taxonomy');
export const FX_FILE = path.join(PKG_DATA, 'fx', 'rates.json');
export const GENERATED_DIR = path.join(PKG_DATA, 'generated');

export const RAW_FILE = path.join(DATA_DIR, 'postings_raw.ndjson');
export const POSTINGS_FILE = path.join(DATA_DIR, 'postings.ndjson');
export const AGGREGATES_FILE = path.join(DATA_DIR, 'aggregates.json');
export const ADJACENCY_FILE = path.join(DATA_DIR, 'adjacency.json');
export const QUALITY_FILE = path.join(DATA_DIR, 'quality-latest.json');
export const UNMAPPED_FILE = path.join(DATA_DIR, 'unmapped-titles.json');
export const FIRST_SEEN_FILE = path.join(DATA_DIR, 'first-seen.json');
