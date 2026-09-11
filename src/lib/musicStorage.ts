import { doc, getDoc, setDoc } from 'firebase/firestore';
import { MusicTrack } from '../types';
import { db } from './firebase';

export const USER_DEFAULT_TRACKS: MusicTrack[] = [
  {
    id: 1,
    title: "I Don't Want to Miss a Thing",
    artist: 'Aerosmith',
    youtubeUrl: 'https://www.youtube.com/watch?v=f_jbPirdnyg',
    youtubeId: 'f_jbPirdnyg',
  },
  {
    id: 2,
    title: 'Always',
    artist: 'Bon Jovi',
    youtubeUrl: 'https://www.youtube.com/watch?v=3Axg4TQo0C0',
    youtubeId: '3Axg4TQo0C0',
  },
  {
    id: 3,
    title: 'Leal',
    artist: 'Djonga',
    youtubeUrl: 'https://www.youtube.com/watch?v=sEhOY55CSng',
    youtubeId: 'sEhOY55CSng',
  },
  {
    id: 4,
    title: 'Semente',
    artist: 'Armandinho',
    youtubeUrl: 'https://www.youtube.com/watch?v=VmMqf5SdehM',
    youtubeId: 'VmMqf5SdehM',
  },
];

const LOCAL_STORAGE_KEY = 'wedding_playlist_tracks_v3';

export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : '';
}

export function getStoredTracks(): MusicTrack[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Check if v2 exists: if it was the old default with Leal first, update to Aerosmith first
    const oldSaved = localStorage.getItem('wedding_playlist_tracks_v2');
    if (oldSaved) {
      const parsedOld = JSON.parse(oldSaved);
      if (Array.isArray(parsedOld) && parsedOld.length === 4 && parsedOld[0]?.title === 'Leal') {
        saveStoredTracks(USER_DEFAULT_TRACKS);
        return USER_DEFAULT_TRACKS;
      } else if (Array.isArray(parsedOld) && parsedOld.length > 0) {
        saveStoredTracks(parsedOld);
        return parsedOld;
      }
    }
  } catch (e) {
    console.error('Error loading playlist tracks:', e);
  }
  return USER_DEFAULT_TRACKS;
}

export async function loadStoredTracks(): Promise<MusicTrack[]> {
  const snapshot = await getDoc(doc(db, 'publicSite', 'music'));
  const tracks = snapshot.exists() ? snapshot.data().tracks : null;
  if (Array.isArray(tracks) && tracks.length > 0) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tracks));
    window.dispatchEvent(new CustomEvent('wedding_playlist_updated', { detail: tracks }));
    return tracks as MusicTrack[];
  }
  return getStoredTracks();
}

export async function saveStoredTracks(tracks: MusicTrack[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tracks));
    window.dispatchEvent(new CustomEvent('wedding_playlist_updated', { detail: tracks }));
    await setDoc(doc(db, 'publicSite', 'music'), { tracks });
  } catch (e) {
    console.error('Failed to save playlist tracks', e);
  }
}

export function resetStoredTracks(): MusicTrack[] {
  saveStoredTracks(USER_DEFAULT_TRACKS);
  return USER_DEFAULT_TRACKS;
}
