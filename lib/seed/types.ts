import type { Pin } from '@/lib/types';

export interface SeedAdapter {
  name: string;
  icon: string;
  supportedVerticals: string[];

  fetchData(params: {
    latitude: number;
    longitude: number;
    radius: number;
    locale?: string;
  }): Promise<SeedPin[]>;
}

export interface SeedPin {
  layerId: string;
  name: { ko: string; ja?: string; en?: string };
  description?: { ko: string; ja?: string; en?: string };
  location: { lat: number; lng: number };
  source: {
    type: 'seed';
    adapter: string;
    externalId?: string;
    externalUrl?: string;
  };
}

export interface SeedResult {
  adapter: string;
  count: number;
  pins: SeedPin[];
  fetchedAt: Date;
}
