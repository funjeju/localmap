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
          const url = `https://gis-heritage.go.kr/openapi/xmlService/spca.do?ccbaKdcd=${category.code}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            }
          });

          if (!response.ok) {
            console.warn(`Heritage API error for ${category.name}:`, response.status);
            return [];
          }

          let data;
          const contentType = response.headers.get('content-type') || '';

          if (contentType.includes('json')) {
            data = await response.json();
          } else if (contentType.includes('xml') || contentType.includes('text')) {
            // If XML is returned, we'll try to parse JSON anyway as some endpoints support both
            const text = await response.text();
            try {
              data = JSON.parse(text);
            } catch {
              console.warn(`Heritage API returned non-JSON for ${category.name}, skipping`);
              return [];
            }
          } else {
            const text = await response.text();
            try {
              data = JSON.parse(text);
            } catch {
              return [];
            }
          }

          const items = data?.spca || data?.data || data?.response || [];
          if (!Array.isArray(items)) {
            return [];
          }

          // Filter by distance and map to SeedPin
          return items
            .filter((item: any) => {
              const itemLat = parseFloat(item.latitude || item.lat || 0);
              const itemLng = parseFloat(item.longitude || item.lng || 0);

              if (itemLat === 0 && itemLng === 0) return false;

              const dist = Math.sqrt(
                Math.pow(itemLat - latitude, 2) + Math.pow(itemLng - longitude, 2)
              ) * 111000; // rough km to meters
              return dist <= radius;
            })
            .map((item: any) => ({
              layerId: 'heritage',
              name: {
                ko: item.cCBAName || item.ccbaName || item.name || item.ccba || 'Unknown',
              },
              description: {
                ko: `${category.name} / ${item.address || item.cCBA || ''}`,
              },
              location: {
                lat: parseFloat(item.latitude || item.lat || latitude),
                lng: parseFloat(item.longitude || item.lng || longitude),
              },
              source: {
                type: 'seed' as const,
                adapter: 'heritage',
                externalId: item.ccba || item.cCBA || `${category.code}-${item.name}`,
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
