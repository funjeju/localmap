import type { SeedAdapter, SeedPin } from '../types';

interface MOIFacility {
  facility_name: string;
  address: string;
  latitude: number;
  longitude: number;
  facility_type: string;
}

export const moiFacilitiesAdapter: SeedAdapter = {
  name: '행안부 공공시설',
  icon: '🏛️',
  supportedVerticals: ['elementary_school'],

  async fetchData({ latitude, longitude, radius }) {
    try {
      // 공공데이터포털 API 호출
      const apiKey = process.env.DATA_GO_KR_API_KEY;
      if (!apiKey) {
        console.warn('DATA_GO_KR_API_KEY not configured');
        return [];
      }

      const params = new URLSearchParams({
        ServiceKey: apiKey,
        pageNo: '1',
        numOfRows: '100',
        resultType: 'json',
        // 위도, 경도 기반 조회 (API 제공처마다 다름)
        lat: latitude.toString(),
        lon: longitude.toString(),
        range: radius.toString(),
      });

      const response = await fetch(
        `https://api.data.go.kr/openapi/tn_pubr_public_fclt_info?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        console.warn('MOI Facilities API error:', response.status);
        return [];
      }

      const data = await response.json();
      const items = data.response?.body?.items?.item || [];

      return items.map((item: MOIFacility) => ({
        layerId: mapFacilityType(item.facility_type),
        name: {
          ko: item.facility_name,
        },
        description: {
          ko: item.address,
        },
        location: {
          lat: typeof item.latitude === 'string' ? parseFloat(item.latitude) : item.latitude,
          lng: typeof item.longitude === 'string' ? parseFloat(item.longitude) : item.longitude,
        },
        source: {
          type: 'seed' as const,
          adapter: 'moi-facilities',
          externalId: item.facility_name,
        },
      })) as SeedPin[];
    } catch (error) {
      console.error('MOI Facilities adapter error:', error);
      return [];
    }
  },
};

function mapFacilityType(facilityType: string): string {
  const typeMap: Record<string, string> = {
    '공공도서관': 'public_library',
    '박물관': 'museum',
    '미술관': 'art_gallery',
    '공원': 'park',
    '체육시설': 'sports_facility',
    '문화센터': 'cultural_center',
    '보건소': 'health_center',
    '주민센터': 'community_center',
    '경찰서': 'police_station',
    '소방서': 'fire_station',
  };

  return typeMap[facilityType] || 'public_facility';
}
