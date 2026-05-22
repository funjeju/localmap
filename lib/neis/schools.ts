export interface NEISSchool {
  schoolName: string;
  address: string;
  schoolCode: string;
  provinceCode: string;
  educationOfficeCode: string;
}

export async function searchSchools(keyword: string): Promise<NEISSchool[]> {
  const apiKey = process.env.NEIS_API_KEY;

  if (!apiKey) {
    console.error('NEIS_API_KEY is not set');
    return [];
  }

  try {
    // NEIS OpenAPI 학교 정보 조회
    const params = new URLSearchParams({
      KEY: apiKey,
      Type: 'json',
      pSize: '10',
      SCHUL_NM: keyword, // 학교명 검색
    });

    const response = await fetch(
      `https://open.neis.go.kr/hub/schoolInfo?${params}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      console.error('NEIS API Error:', response.status);
      return [];
    }

    const data = await response.json();

    // Parse NEIS response
    if (!data.schoolInfo || !Array.isArray(data.schoolInfo)) {
      return [];
    }

    return data.schoolInfo[1].row.map((school: any) => ({
      schoolName: school.SCHUL_NM,
      address: `${school.LCTN_SC_NM} ${school.ADDR}`,
      schoolCode: school.SD_SCHUL_CODE,
      provinceCode: school.CTPRVN_CODE,
      educationOfficeCode: school.SIG_CODE,
    }));
  } catch (error) {
    console.error('NEIS API search error:', error);
    return [];
  }
}

export async function getSchoolsByProvince(
  province: string,
  limit: number = 20
): Promise<NEISSchool[]> {
  const apiKey = process.env.NEIS_API_KEY;

  if (!apiKey) {
    console.error('NEIS_API_KEY is not set');
    return [];
  }

  try {
    const params = new URLSearchParams({
      KEY: apiKey,
      Type: 'json',
      pSize: String(limit),
      LCTN_SC_NM: province,
    });

    const response = await fetch(
      `https://open.neis.go.kr/hub/schoolInfo?${params}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.schoolInfo || !Array.isArray(data.schoolInfo)) {
      return [];
    }

    return data.schoolInfo[1].row.map((school: any) => ({
      schoolName: school.SCHUL_NM,
      address: `${school.LCTN_SC_NM} ${school.ADDR}`,
      schoolCode: school.SD_SCHUL_CODE,
      provinceCode: school.CTPRVN_CODE,
      educationOfficeCode: school.SIG_CODE,
    }));
  } catch (error) {
    console.error('NEIS API error:', error);
    return [];
  }
}
