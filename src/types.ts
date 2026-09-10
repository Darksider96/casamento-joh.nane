export interface RSVPData {
  id: string;
  fullName: string;
  attending: 'yes' | 'no';
  phone: string;
  adultsCount: number;
  childrenCount: number;
  companionNames: string;
  dietaryRestrictions?: string;
  message?: string;
  submittedAt: string;
  syncedToSheets?: boolean;
}

export type MediaType = 'image' | 'video';
export type TransitionStyle = 'coverflow' | 'slide' | 'fade';
export type ObjectFitMode = 'cover' | 'contain';

export interface CarouselConfig {
  transitionEffect: TransitionStyle;
  objectFitMode: ObjectFitMode;
}

export interface CouplePhoto {
  id: string;
  url: string;
  type?: MediaType;
  title: string;
  caption: string;
  thumbnail?: string;
  isCustom?: boolean;
}

export interface SheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetTitle: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface MusicTrack {
  id: number; // 1, 2, or 3
  title: string;
  artist?: string;
  youtubeUrl: string;
  youtubeId: string;
}
