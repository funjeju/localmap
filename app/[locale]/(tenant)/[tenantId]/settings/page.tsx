'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Tenant, TenantMembership } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Member {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  joinedAt: string;
}

interface InviteCode {
  code: string;
  role: string;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
}

function SettingsContent() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const locale = (params.locale as string) || 'ko';

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Auth check
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (!firebaseUser) {
        router.push(`/${locale}/login`);
        return;
      }
      setUser(firebaseUser);
    });

    return unsubscribe;
  }, [router, locale]);

  // Load tenant and members
  useEffect(() => {
    if (!tenantId || !user) return;

    const loadData = async () => {
      try {
        // Load tenant
        const tenantRef = doc(db, 'tenants', tenantId);
        const tenantSnap = await getDoc(tenantRef);

        if (!tenantSnap.exists) {
          throw new Error('Tenant not found');
        }

        setTenant(tenantSnap.data() as Tenant);

        // Load members
        const membersRes = await fetch(`/api/tenant/${tenantId}/members`);
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);

        // Load invite codes
        const codesRes = await fetch(`/api/tenant/${tenantId}/invite-code`);
        const codesData = await codesRes.json();
        setInviteCodes(codesData.codes || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId, user]);

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/tenant/${tenantId}/invite-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 7 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '초대 코드 생성에 실패했습니다.');
      }

      if (data.code) {
        setInviteCodes([...inviteCodes, data]);
        alert('초대 코드가 생성되었습니다.');
      }
    } catch (err: any) {
      console.error('초대 코드 생성 오류:', err);
      alert(err?.message || '초대 코드 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('이 멤버를 제거하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/tenant/${tenantId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '멤버 제거에 실패했습니다.');
      }

      setMembers(members.filter((m) => m.userId !== userId));
      alert('멤버가 제거되었습니다.');
    } catch (err: any) {
      console.error('멤버 제거 오류:', err);
      alert(err?.message || '멤버 제거에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Tenant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            ← 돌아가기
          </Button>
        </div>

        {/* Tenant Info */}
        <Card>
          <CardHeader>
            <CardTitle>학교 정보</CardTitle>
            <CardDescription>학교 세부 정보를 확인하고 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">학교명</label>
              <p className="text-lg font-semibold">
                {typeof tenant.name === 'object' ? tenant.name.ko : tenant.name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">주소</label>
              <p>{tenant.address}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">탐방 반경</label>
              <p>{tenant.radius}m</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">언어</label>
              <p>{tenant.locale === 'ko-KR' ? '한국어' : tenant.locale}</p>
            </div>
          </CardContent>
        </Card>

        {/* Invite Codes */}
        <Card>
          <CardHeader>
            <CardTitle>초대 코드</CardTitle>
            <CardDescription>학생들이 참가할 수 있도록 초대 코드를 생성합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateCode} disabled={generating}>
              {generating ? '생성 중...' : '새 코드 생성'}
            </Button>

            {inviteCodes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">코드</th>
                      <th className="text-left py-2">사용 횟수</th>
                      <th className="text-left py-2">만료 날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inviteCodes.map((code) => (
                      <tr key={code.code} className="border-b">
                        <td className="py-2">
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {code.code}
                          </code>
                        </td>
                        <td className="py-2">{code.usedCount}</td>
                        <td className="py-2">
                          {new Date(code.expiresAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">아직 초대 코드가 없습니다</p>
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>멤버 ({members.length})</CardTitle>
            <CardDescription>선생님과 학생들을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">이름</th>
                      <th className="text-left py-2">이메일</th>
                      <th className="text-left py-2">역할</th>
                      <th className="text-left py-2">상태</th>
                      <th className="text-left py-2">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.userId} className="border-b">
                        <td className="py-2">{member.displayName || '-'}</td>
                        <td className="py-2">{member.email || '-'}</td>
                        <td className="py-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {member.role === 'teacher' ? '선생님' : member.role === 'student' ? '학생' : member.role}
                          </span>
                        </td>
                        <td className="py-2">{member.status === 'active' ? '활성' : member.status}</td>
                        <td className="py-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            제거
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">아직 멤버가 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
