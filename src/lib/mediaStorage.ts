import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CarouselConfig, CouplePhoto } from '../types';
import { db } from './firebase';

const CAROUSEL_DOC = doc(db, 'publicSite', 'carousel');
const CAROUSEL_CONFIG_KEY = 'wedding_carousel_config_v1';

const DEFAULT_CAROUSEL_CONFIG: CarouselConfig = {
  transitionEffect: 'coverflow',
  objectFitMode: 'cover',
};

export const FIXED_MEDIA: CouplePhoto[] = [
  { id: 'foto-01', url: '/fotos/01.jpeg', type: 'image', title: 'Nossa História', caption: 'Johnatan & Regiane' },
  { id: 'foto-02', url: '/fotos/02.jpeg', type: 'image', title: 'Nós Dois', caption: 'Momentos que guardamos com carinho' },
  { id: 'foto-03', url: '/fotos/03.jpeg', type: 'image', title: 'Nosso Amor', caption: 'Uma história construída juntos' },
  { id: 'foto-04', url: '/fotos/04.jpeg', type: 'image', title: 'Nossa Jornada', caption: 'Cada momento nos trouxe até aqui' },
  { id: 'foto-05', url: '/fotos/05.jpeg', type: 'image', title: 'Cumplicidade', caption: 'Sorrisos, sonhos e muito amor' },
  { id: 'foto-06', url: '/fotos/06.jpeg', type: 'image', title: 'Para Sempre', caption: 'O começo de um novo capítulo' },
  { id: 'foto-07', url: '/fotos/07.jpeg', type: 'image', title: 'Johnatan & Regiane', caption: '25 de setembro de 2026' },
  { id: 'video-08', url: '/fotos/08.mp4', type: 'video', title: 'Nossa História', caption: 'Um momento especial em movimento' },
];

export async function getStoredMedia(): Promise<CouplePhoto[]> {
  return FIXED_MEDIA;
}

export async function saveMediaItem(_item: CouplePhoto): Promise<void> {
  throw new Error('As fotos são fixas e devem ser alteradas na pasta public/fotos.');
}

export async function saveAllMedia(_items: CouplePhoto[]): Promise<CouplePhoto[]> {
  throw new Error('As fotos são fixas e devem ser alteradas na pasta public/fotos.');
}

export async function deleteMediaItem(_id: string): Promise<void> {
  throw new Error('As fotos são fixas e devem ser alteradas na pasta public/fotos.');
}

export async function clearAllStoredMedia(): Promise<void> {
  throw new Error('As fotos são fixas e devem ser alteradas na pasta public/fotos.');
}

export function getCarouselConfig(): CarouselConfig {
  try {
    const saved = localStorage.getItem(CAROUSEL_CONFIG_KEY);
    if (saved) return { ...DEFAULT_CAROUSEL_CONFIG, ...JSON.parse(saved) };
  } catch (error) {
    console.warn('Não foi possível ler a configuração local do carrossel.', error);
  }
  return DEFAULT_CAROUSEL_CONFIG;
}

export async function loadCarouselConfig(): Promise<CarouselConfig> {
  const snapshot = await getDoc(CAROUSEL_DOC);
  const config = snapshot.exists()
    ? ({ ...DEFAULT_CAROUSEL_CONFIG, ...snapshot.data() } as CarouselConfig)
    : getCarouselConfig();

  localStorage.setItem(CAROUSEL_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('wedding_carousel_config_updated', { detail: config }));
  return config;
}

export async function saveCarouselConfig(config: CarouselConfig): Promise<void> {
  localStorage.setItem(CAROUSEL_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('wedding_carousel_config_updated', { detail: config }));
  await setDoc(CAROUSEL_DOC, config);
}
