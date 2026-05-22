import { NextResponse } from 'next/server';
import { searchSchools } from '@/lib/neis/schools';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('q');

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ schools: [] });
    }

    const schools = await searchSchools(keyword.trim());

    return NextResponse.json({ schools });
  } catch (error) {
    console.error('School search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search schools', schools: [] },
      { status: 500 }
    );
  }
}
