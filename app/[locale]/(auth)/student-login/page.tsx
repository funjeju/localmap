'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, auth } from '@/lib/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { addUserToTenant, validateAndUseInviteCode } from '@/lib/firebase/memberships';
import Link from 'next/link';

export default function StudentLoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [tenantCode, setTenantCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate and use invite code
      const [tenantId, inviteCode] = tenantCode.split('-');

      if (!tenantId || !inviteCode) {
        throw new Error('Invalid code format');
      }

      // Verify the code exists and get the role
      const role = await validateAndUseInviteCode(tenantId, inviteCode);

      // Sign in anonymously for students
      const result = await signInAnonymously(auth);

      // Add user to tenant
      await addUserToTenant(result.user.uid, tenantId, role);

      router.push(`/ko/dashboard?tenantId=${tenantId}`);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-center">LocalMap</h1>
        <p className="text-center text-gray-600 mb-8">Student Login</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleStudentLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Invite Code
            </label>
            <Input
              type="text"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
              placeholder="e.g., SCHOOL-ABC123"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ask your teacher for the code
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Enter'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Teacher?{' '}
          <Link href="/ko/login" className="font-medium text-blue-600 hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
