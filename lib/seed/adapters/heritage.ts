import type { SeedAdapter, SeedPin } from '../types';

interface HeritageItem {
  ccbaName: string;
  ccbaAsgnGbName: string;
  latitude: string;
  longitude: string;
  address: string;
  itemName: string;
  description: string;
  ccbaKdcd?: string;
}

interface HeritageCategory {
  code: string;
  name: string;
}

const HERITAGE_CATEGORIES: HeritageCategory[] = [
  { code: '11', name: '국보' },
  { code: '12', name: '보물' },
  { code: '13', name: '사적' },
  { code: '15', name: '명승' },
  { code: '16', name: '천연기념물' },
  { code: '17', name: '국가무형유산' },
  { code: '18', name: '국가 민속문화유산' },
  { code: '79', name: '등록문화유산' },
];

export const heritageAdapter: SeedAdapter = {
  name: '문화재청 지정 문화재',
  icon: '🏯',
  supportedVerticals: ['elementary_school'],

  async fetchData({ latitude, longitude, radius }) {
    try {
      const allPins: SeedPin[] = [];

      // Fetch from all heritage categories in parallel
      const categoryRequests = HERITAGE_CATEGORIES.map(async (category) => {
        try {
          const response = await fetch(
            `https://gis-heritage.go.kr/openapi/xmlService/spca.do?ccbaKdcd=${category.code}`,
            { method: 'GET', headers: { Accept: 'application/json' } }
          );

          if (!response.ok) {
            console.warn(`Heritage API error for ${category.name}:`, response.status);
            return [];
          }

          const data = await response.json();
          const items = data.spca || [];

          // Filter by distance and map to SeedPin
          return items
            .filter((item: any) => {
              const itemLat = parseFloat(item.latitude || 0);
              const itemLng = parseFloat(item.longitude || 0);
              const dist = Math.sqrt(
                Math.pow(itemLat - latitude, 2) + Math.pow(itemLng - longitude, 2)
              ) * 111000; // rough km to meters
              return dist <= radius;
            })
            .map((item: any) => ({
              layerId: 'heritage',
              name: {
                ko: item.cCBAName || item.ccbaName || item.name || 'Unknown',
              },
              description: {
                ko: `${category.name} / ${item.cCBA || item.ccba || item.address || ''}`,
              },
              location: {
                lat: parseFloat(item.latitude || latitude),
                lng: parseFloat(item.longitude || longitude),
              },
              source: {
                type: 'seed' as const,
                adapter: 'heritage',
                externalId: item.cCBA || item.ccba || item.name || '',
                externalUrl: `https://www.heritage.go.kr`,
              },
            }));
        } catch (error) {
          console.error(`Error fetching heritage category ${category.name}:`, error);
          return [];
        }
      });

      const results = await Promise.all(categoryRequests);
      results.forEach((pins) => allPins.push(...pins));

      return allPins;
    } catch (error) {
      console.error('Heritage adapter error:', error);
      return [];
    }
  },
};
