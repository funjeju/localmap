'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebase/auth';
import { getUserTenantMemberships } from '@/lib/firebase/memberships';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { TenantMembership } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/firebase/auth';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [memberships, setMemberships] = useState<
    (TenantMembership & { tenantId: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const tenantIdParam = searchParams.get('tenantId');

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (!firebaseUser) {
        router.push('/ko/login');
        return;
      }

      setUser(firebaseUser);

      // Load tenant memberships
      getUserTenantMemberships(firebaseUser.uid)
        .then((mems) => {
          setMemberships(mems);
          // Redirect to first tenant's map if available
          if (mems.length > 0) {
            const tenantId = mems[0].tenantId;
            router.push(`/ko/tenant/${tenantId}/map`);
          } else if (!tenantIdParam) {
            // Show tenant selection or onboarding
          }
        })
        .catch((err) => console.error('Failed to load memberships:', err))
        .finally(() => setLoading(false));
    });

    return unsubscribe;
  }, [router, tenantIdParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              router.push('/ko/login');
            }}
          >
            Logout
          </Button>
        </div>

        {user && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-2">{user.displayName}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        )}

        {memberships.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold mb-4">
              No organizations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create a new school or join an existing one
            </p>
            <Button onClick={() => router.push('/ko/onboarding')}>
              Create School
            </Button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Your Organizations</h3>
            <div className="space-y-4">
              {memberships.map((membership) => (
                <div
                  key={membership.tenantId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{membership.tenantId}</p>
                    <p className="text-sm text-gray-600">
                      Role: {membership.role}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      router.push(`/ko/tenant/${membership.tenantId}/map`);
                    }}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
