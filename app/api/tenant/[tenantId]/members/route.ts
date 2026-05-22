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

    // Get all users that have this tenant in their memberships
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.get();

    const members = [];

    for (const userDoc of snapshot.docs) {
      const membershipRef = userDoc.ref.collection('tenantMemberships').doc(tenantId);
      const membershipSnap = await membershipRef.get();

      if (membershipSnap.exists) {
        const membershipData = membershipSnap.data() as any;
        if (membershipData) {
          members.push({
            userId: userDoc.id,
            email: userDoc.data().email,
            displayName: userDoc.data().displayName,
            role: membershipData.role,
            status: membershipData.status,
            joinedAt: membershipData.joinedAt?.toDate?.(),
          });
        }
      }
    }

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Fetch Members Error:', error);
    const errorResponse = createErrorResponse(
      error instanceof AppError ? error : new AppError('server/error', error?.message || 'Unknown error', '멤버 목록을 불러올 수 없습니다.', 500)
    );
    return NextResponse.json(
      { error: errorResponse.error, message: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const { userId } = await req.json();

    if (!tenantId || !userId) {
      throw new AppError(
        'validation/invalid-input',
        'tenantId and userId are required',
        '필수 정보가 누락되었습니다.',
        400
      );
    }

    const membershipRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('tenantMemberships')
      .doc(tenantId);

    await membershipRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove Member Error:', error);
    const errorResponse = createErrorResponse(
      error instanceof AppError ? error : new AppError('server/error', error?.message || 'Unknown error', '멤버 제거에 실패했습니다.', 500)
    );
    return NextResponse.json(
      { error: errorResponse.error, message: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
