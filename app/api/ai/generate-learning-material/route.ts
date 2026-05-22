import { NextResponse } from 'next/server';
import { generateLearningMaterial } from '@/lib/ai/claude';
import { adminDb } from '@/lib/firebase/admin';
import { createErrorResponse, AppError } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const { tenantId, tenantName, pins, locale, focusAreas, gradeLevel } = await req.json();

    if (!tenantId || !tenantName || !pins || !Array.isArray(pins)) {
      throw new AppError(
        'validation/invalid-input',
        'Missing required fields: tenantId, tenantName, pins',
        '필수 정보가 누락되었습니다.',
        400
      );
    }

    if (pins.length === 0) {
      throw new AppError(
        'validation/invalid-input',
        'Pins array is empty',
        '탐방 데이터가 없습니다.',
        400
      );
    }

    // Generate learning material using Claude
    const material = await generateLearningMaterial({
      tenantName,
      pins,
      locale,
      focusAreas,
      gradeLevel,
    });

    // Save to Firestore
    const materialRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('learningMaterials')
      .doc();

    const materialData = {
      id: materialRef.id,
      tenantId,
      ...material,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    await materialRef.set(materialData);

    return NextResponse.json({
      success: true,
      materialId: materialRef.id,
      material: materialData,
    });
  } catch (error: any) {
    console.error('Generate Learning Material Error:', error);
    const errorResponse = createErrorResponse(
      error instanceof AppError
        ? error
        : new AppError(
            'server/ai-error',
            error?.message || 'Failed to generate learning material',
            '학습 자료 생성에 실패했습니다.',
            500
          )
    );
    return NextResponse.json(
      { error: errorResponse.error, message: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
