import { db } from './config';
import {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import type { TenantMembership, Role } from '@/lib/types';

export const addUserToTenant = async (
  userId: string,
  tenantId: string,
  role: Role
) => {
  const membershipRef = doc(db, `users/${userId}/tenantMemberships`, tenantId);
  const membership: TenantMembership = {
    tenantId,
    role,
    joinedAt: new Date(),
    status: 'active',
  };
  await setDoc(membershipRef, membership);
};

export const getUserTenantMemberships = async (userId: string) => {
  const membershipRef = collection(db, `users/${userId}/tenantMemberships`);
  const snapshot = await getDocs(membershipRef);
  return snapshot.docs.map((doc) => ({
    tenantId: doc.id,
    ...doc.data(),
  })) as (TenantMembership & { tenantId: string })[];
};

export const getUserMembershipForTenant = async (
  userId: string,
  tenantId: string
) => {
  const membershipRef = doc(
    db,
    `users/${userId}/tenantMemberships`,
    tenantId
  );
  const snapshot = await getDoc(membershipRef);
  return snapshot.data() as TenantMembership | undefined;
};

export const updateUserRole = async (
  userId: string,
  tenantId: string,
  role: Role
) => {
  const membershipRef = doc(
    db,
    `users/${userId}/tenantMemberships`,
    tenantId
  );
  await setDoc(membershipRef, { role }, { merge: true });
};

export const removeUserFromTenant = async (
  userId: string,
  tenantId: string
) => {
  const membershipRef = doc(
    db,
    `users/${userId}/tenantMemberships`,
    tenantId
  );
  await deleteDoc(membershipRef);
};

export const createStudentInviteCode = async (
  tenantId: string,
  code: string,
  expiresAt: Date
) => {
  const codeRef = doc(db, `tenants/${tenantId}/inviteCodes`, code);
  await setDoc(codeRef, {
    code,
    role: 'student',
    createdAt: new Date(),
    expiresAt,
    usedCount: 0,
  });
};

export const validateAndUseInviteCode = async (
  tenantId: string,
  code: string
) => {
  const codeRef = doc(db, `tenants/${tenantId}/inviteCodes`, code);
  const snapshot = await getDoc(codeRef);

  if (!snapshot.exists()) {
    throw new Error('Invalid invite code');
  }

  const data = snapshot.data();
  if (new Date(data.expiresAt) < new Date()) {
    throw new Error('Invite code expired');
  }

  // Increment usage count
  await setDoc(
    codeRef,
    { usedCount: (data.usedCount || 0) + 1 },
    { merge: true }
  );

  return data.role as Role;
};
