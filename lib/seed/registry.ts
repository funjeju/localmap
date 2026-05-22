import type { SeedAdapter, SeedResult, SeedPin } from './types';
import { moiFacilitiesAdapter } from './adapters/moi-facilities';
import { heritageAdapter } from './adapters/heritage';
import { calculateGeoHash } from '@/lib/geo/hash';

export class SeedRegistry {
  private adapters: Map<string, SeedAdapter> = new Map();

  constructor() {
    this.register('moi-facilities', moiFacilitiesAdapter);
    this.register('heritage', heritageAdapter);
  }

  register(id: string, adapter: SeedAdapter) {
    this.adapters.set(id, adapter);
  }

  getAdapter(id: string): SeedAdapter | undefined {
    return this.adapters.get(id);
  }

  listAdapters(vertical: string): SeedAdapter[] {
    return Array.from(this.adapters.values()).filter(
      (a) => a.supportedVerticals.includes(vertical) || a.supportedVerticals.includes('*')
    );
  }

  async seedTenant(
    vertical: string,
    location: { lat: number; lng: number },
    radius: number = 500
  ): Promise<SeedResult[]> {
    const adapters = this.listAdapters(vertical);
    const results: SeedResult[] = [];

    for (const adapter of adapters) {
      try {
        const seedPins = await adapter.fetchData({
          latitude: location.lat,
          longitude: location.lng,
          radius,
        });

        // 변환: SeedPin → Pin (GeoHash 추가)
        const pinsWithGeoHash = seedPins.map((pin) => ({
          ...pin,
          location: {
            ...pin.location,
            geohash: calculateGeoHash(pin.location.lat, pin.location.lng),
          },
        }));

        results.push({
          adapter: adapter.name,
          count: pinsWithGeoHash.length,
          pins: pinsWithGeoHash,
          fetchedAt: new Date(),
        });
      } catch (error) {
        console.error(`Seed adapter error (${adapter.name}):`, error);
        results.push({
          adapter: adapter.name,
          count: 0,
          pins: [],
          fetchedAt: new Date(),
        });
      }
    }

    return results;
  }
}

export const seedRegistry = new SeedRegistry();
