'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { subscribeToAuthChanges } from '@/lib/firebase/auth';
import { getUserTenantMemberships } from '@/lib/firebase/memberships';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tenant, TenantMembership } from '@/lib/types';

interface AdminTenant extends Tenant, TenantMembership {
  memberCount?: number;
}

function AdminContent() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'ko';

  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Check auth and load admin tenants
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push(`/${locale}/login`);
        return;
      }

      setUser(firebaseUser);

      try {
        // Get all tenants where user is teacher or admin
        const memberships = await getUserTenantMemberships(firebaseUser.uid);
        const adminTenants = memberships.filter(
          (m) => m.role === 'teacher' || m.role === 'admin'
        );

        const tenantsData: AdminTenant[] = [];
        for (const membership of adminTenants) {
          const tenantRef = doc(db, 'tenants', membership.tenantId);
          const tenantSnap = await getDoc(tenantRef);

          if (tenantSnap.exists()) {
            tenantsData.push({
              ...(tenantSnap.data() as Tenant),
              ...membership,
            });
          }
        }

        setTenants(tenantsData);
      } catch (err) {
        console.error('Failed to load admin tenants:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 패널</h1>
            <p className="text-gray-600 mt-2">학교 및 학생 관리</p>
          </div>
          <Link href={`/${locale}`}>
            <Button variant="outline">← Home</Button>
          </Link>
        </div>

        {/* Create New School */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>새 학교 생성</CardTitle>
            <CardDescription>새로운 학교를 등록하고 관리를 시작하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/admin/create-school`}>
              <Button className="w-full">
                <span className="text-lg mr-2">+</span> 새 학교 생성
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Managed Schools */}
        <div>
          <h2 className="text-xl font-bold mb-4">관리 중인 학교</h2>

          {tenants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map((tenant) => (
                <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {typeof tenant.name === 'object' ? tenant.name.ko : tenant.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mt-2">
                        {tenant.role === 'admin' ? '관리자' : '선생님'}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">주소</p>
                      <p className="text-sm font-medium">{tenant.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">탐방 반경</p>
                      <p className="text-sm font-medium">{tenant.radius}m</p>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <Link href={`/${locale}/tenant/${tenant.id}/map`} className="flex-1">
                        <Button variant="outline" className="w-full text-sm">
                          지도 보기
                        </Button>
                      </Link>
                      <Link href={`/${locale}/tenant/${tenant.id}/settings`} className="flex-1">
                        <Button variant="outline" className="w-full text-sm">
                          설정
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <p>관리 중인 학교가 없습니다.</p>
                <p className="text-sm mt-2">새 학교를 생성하여 시작하세요.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}
