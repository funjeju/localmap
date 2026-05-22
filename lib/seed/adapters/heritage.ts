import type { SeedAdapter, SeedPin } from '../types';

interface HeritageItem {
  ccbaName: string;
  ccbaAsgnGbName: string;
  latitude: string;
  longitude: string;
  address: string;
  itemName: string;
  description: string;
}

export const heritageAdapter: SeedAdapter = {
  name: '문화재청 지정 문화재',
  icon: '🏯',
  supportedVerticals: ['elementary_school'],

  async fetchData({ latitude, longitude, radius }) {
    try {
      const apiKey = process.env.DATA_GO_KR_API_KEY;
      if (!apiKey) {
        console.warn('DATA_GO_KR_API_KEY not configured');
        return [];
      }

      // 문화재청 API (공공데이터포털)
      const params = new URLSearchParams({
        ServiceKey: apiKey,
        pageNo: '1',
        numOfRows: '100',
        resultType: 'json',
        lat: latitude.toString(),
        lon: longitude.toString(),
        distance: radius.toString(),
      });

      const response = await fetch(
        `https://api.data.go.kr/openapi/tn_pubr_hrtg_info?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        console.warn('Heritage API error:', response.status);
        return [];
      }

      const data = await response.json();
      const items = data.response?.body?.items?.item || [];

      return items.map((item: HeritageItem) => ({
        layerId: 'heritage',
        name: {
          ko: item.ccbaName,
        },
        description: {
          ko: `${item.ccbaAsgnGbName} / ${item.address}`,
        },
        location: {
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude),
        },
        source: {
          type: 'seed' as const,
          adapter: 'heritage',
          externalId: item.ccbaName,
          externalUrl: `https://www.heritage.go.kr`,
        },
      })) as SeedPin[];
    } catch (error) {
      console.error('Heritage adapter error:', error);
      return [];
    }
  },
};
