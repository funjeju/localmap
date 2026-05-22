import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createErrorResponse, AppError } from '@/lib/errors';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    if (!tenantId) {
      throw new AppError(
        'validation/invalid-input',
        'tenantId is required',
        '학교 ID가 필요합니다.',
        400
      );
    }

    const tenantRef = adminDb.collection('tenants').doc(tenantId);
    const tenantSnap = await tenantRef.get();

    if (!tenantSnap.exists) {
      throw new AppError(
        'tenant/not-found',
        'Tenant not found',
        '학교를 찾을 수 없습니다.',
        404
      );
    }

    const tenant = tenantSnap.data();

    return NextResponse.json({ tenant });
  } catch (error: any) {
    console.error('Fetch Tenant Error:', error);
    const errorResponse = createErrorResponse(
      error instanceof AppError
        ? error
        : new AppError('server/error', error?.message || 'Unknown error', '학교 정보를 불러올 수 없습니다.', 500)
    );
    return NextResponse.json(
      { error: errorResponse.error, message: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
