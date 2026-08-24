/* The saved-jobs store. Guest-first: saves live in localStorage as FULL
   snapshots, never bare ids — job ids are sha1(posting url)[:10] and a
   posting can rotate out of the nightly build, so a save must be able to
   outlive its row. Signed-in state mirrors the server into the same key so
   the board renders saved marks with zero auth round-trips.

   Every mutation dispatches 'ph-saved-change' on window; any component
   showing saved state (button, rail count, dashboard) subscribes to that. */

export type SavedStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export type SavedJob = {
  occ: string;
  id: string;
  title: string;
  company: string;
  location?: string;
  remote?: boolean;
  smin?: number;
  smax?: number;
  posted?: string;
  url?: string;
  logo?: string;
  savedAt: string;
  status: SavedStatus;
  appliedAt?: string;
  notes?: string;
};

const KEY = 'ph-saved';
const CAP = 50;
const EVT = 'ph-saved-change';

// the ladder a status can only climb during merges (rejected is terminal-ish
// but still "further along" than a bare save)
export const STATUS_ORDER: SavedStatus[] = ['saved', 'applied', 'interviewing', 'offer', 'rejected'];

export function readSaved(): SavedJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: SavedJob[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP)));
  } catch { /* storage full or blocked — the in-memory state already updated */ }
  window.dispatchEvent(new CustomEvent(EVT));
}

export function isSaved(occ: string, id: string): boolean {
  return readSaved().some((s) => s.occ === occ && s.id === id);
}

export function savedCount(): number {
  return readSaved().length;
}

/** Toggle. Returns true if the job is saved after the call. */
export function toggleSave(job: Omit<SavedJob, 'savedAt' | 'status'>): boolean {
  const list = readSaved();
  const i = list.findIndex((s) => s.occ === job.occ && s.id === job.id);
  if (i >= 0) {
    list.splice(i, 1);
    write(list);
    return false;
  }
  list.unshift({ ...job, savedAt: new Date().toISOString(), status: 'saved' });
  write(list);
  return true;
}

export function updateSaved(occ: string, id: string, patch: Partial<Pick<SavedJob, 'status' | 'notes' | 'appliedAt'>>) {
  const list = readSaved();
  const s = list.find((x) => x.occ === occ && x.id === id);
  if (!s) return;
  Object.assign(s, patch);
  if (patch.status === 'applied' && !s.appliedAt) s.appliedAt = new Date().toISOString();
  write(list);
}

export function removeSaved(occ: string, id: string) {
  write(readSaved().filter((s) => !(s.occ === occ && s.id === id)));
}

/** Replace the local mirror with the server's canonical list (post-merge). */
export function replaceAll(list: SavedJob[]) {
  write(list);
}

export function onSavedChange(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVT, fn);
  // storage events cover other tabs
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(EVT, fn);
    window.removeEventListener('storage', fn);
  };
}
