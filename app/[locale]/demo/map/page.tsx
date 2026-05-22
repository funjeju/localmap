'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useMapStore } from '@/stores/mapStore';
import type { Tenant } from '@/lib/types';
import MapCanvas from '@/components/map/MapCanvas';
import LayerFilterPanel from '@/components/map/LayerFilterPanel';
import Link from 'next/link';

const DEMO_TENANT: Tenant = {
  id: 'demo-school',
  type: 'elementary_school',
  name: { ko: '역삼초등학교 (데모)' },
  shortName: { ko: '역삼초' },
  address: '서울특별시 강남구 역삼동',
  addressLocale: 'KR',
  center: { lat: 37.4979, lng: 127.0276, geohash: 'wydm' },
  radius: 1000,
  locale: 'ko-KR',
  supportedLocales: ['ko-KR'],
  plan: 'trial',
  features: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
};

function DemoMapContent() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'ko';
  const setStudentMode = useMapStore((state) => state.setStudentMode);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStudentMode(true);
    setTenant(DEMO_TENANT);
    setLoading(false);
  }, [setStudentMode]);

  if (loading || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demo map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Demo Map Explorer</h1>
            <p className="text-xs text-gray-500">{tenant.address}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`} className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Link>
            <Link
              href={`/${locale}/login`}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              Sign In to Explore
            </Link>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="pt-16 w-full h-full">
        <MapCanvas
          tenantId={tenant.id}
          tenantCenter={{ lat: tenant.center.lat, lng: tenant.center.lng }}
          tenantRadius={tenant.radius}
          locale={locale}
        />
      </div>

      {/* Info Banner */}
      <div className="absolute bottom-4 left-4 z-10 max-w-sm bg-white rounded-lg shadow-lg p-4 border border-primary/20">
        <h3 className="font-bold text-sm mb-2 text-gray-900">탐방 데모 지도</h3>
        <p className="text-xs text-gray-600 mb-3">
          이 지도는 LocalMap의 기능을 체험해보는 데모입니다. 지도를 자유롭게 탐색하고 우리 동네의 이야기를 발견해보세요!
        </p>
        <Link
          href={`/${locale}/signup`}
          className="inline-block text-xs text-white bg-primary px-3 py-1.5 rounded hover:bg-primary/90 font-medium"
        >
          가입하고 시작하기
        </Link>
      </div>
    </div>
  );
}

export default function DemoMapPage() {
  return <DemoMapContent />;
}
