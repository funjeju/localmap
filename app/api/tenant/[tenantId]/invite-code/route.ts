import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createErrorResponse, AppError } from '@/lib/errors';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const { expiresIn } = await req.json(); // in days

    if (!tenantId) {
      throw new AppError(
        'validation/invalid-input',
        'tenantId is required',
        '학교 ID가 필요합니다.',
        400
      );
    }

    // Generate unique code
    const code = uuidv4().substring(0, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresIn || 7));

    const codeRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('inviteCodes')
      .doc(code);

    await codeRef.set({
      code,
      role: 'student',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      usedCount: 0,
    });

    return NextResponse.json({ success: true, code, expiresAt });
  } catch (error: any) {
    console.error('Invite Code Creation Error:', error);
    const errorResponse = createErrorResponse(
      error instanceof AppError ? error : new AppError('server/error', error?.message || 'Unknown error', '초대 코드 생성에 실패했습니다.', 500)
    );
    return NextResponse.json(
      { error: errorResponse.error, message: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}

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

    const codesRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('inviteCodes');

    const snapshot = await codesRef
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const codes = snapshot.docs.map((doc) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      expiresAt: doc.data().expiresAt?.toDate?.(),
    }));

    return NextResponse.json({ codes });
  } catch (error: any) {
    console.error('Fetch Invite Codes Error:', error);
    const errorResponse = createErrorResponse(
      error instanceof AppError ? error : new AppError('server/error', error?.message || 'Unknown error', '초대 코드를 불러올 수 없습니다.', 500)
    );
    return NextResponse.json(
      { error: errorResponse.error, message: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
