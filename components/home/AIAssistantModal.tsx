'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebase/auth';
import { getUserTenantMemberships } from '@/lib/firebase/memberships';
import { subscribeToPins } from '@/lib/firebase/pins';
import type { LearningMaterial } from '@/lib/types';

export default function AIAssistantModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const params = useParams();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [pins, setPins] = useState<any[]>([]);

  // Load user and tenant info
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        setError('로그인이 필요합니다.');
        return;
      }
      setUser(firebaseUser);

      // Get first tenant
      const memberships = await getUserTenantMemberships(firebaseUser.uid);
      if (memberships.length > 0) {
        setTenantId(memberships[0].tenantId);

        // Get tenant name from Firestore
        const tenantSnap = await fetch(`/api/tenant/${memberships[0].tenantId}`)
          .then(r => r.json())
          .catch(() => null);
        if (tenantSnap?.tenant?.name?.ko) {
          setTenantName(tenantSnap.tenant.name.ko);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Load pins for tenant
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = subscribeToPins(tenantId, (loadedPins) => {
      setPins(loadedPins.slice(0, 20)); // Limit to 20 most recent
    });

    return unsubscribe;
  }, [tenantId]);

  const handleGenerateMaterial = async () => {
    if (!tenantId || pins.length === 0) {
      setError('탐방 데이터가 없습니다.');
      return;
    }

    setGenerating(true);
    setError('');
    setStep(0);

    try {
      const response = await fetch('/api/ai/generate-learning-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          tenantName: tenantName || '우리 학교',
          pins: pins.map((p) => ({
            name: p.name?.ko || p.name,
            description: p.description?.ko || p.description,
            layerId: p.layerId,
            images: p.images?.map((img: any) => img.url) || [],
          })),
          locale: 'ko',
          gradeLevel: '초등학생',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '학습 자료 생성 실패');
      }

      const data = await response.json();
      setMaterial(data.material);

      // Step animation
      setTimeout(() => setStep(1), 1500);
      setTimeout(() => setStep(2), 3500);
    } catch (err: any) {
      setError(err.message || '학습 자료 생성 중 오류가 발생했습니다.');
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (material) {
      setGenerating(false);
    }
  }, [material]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="text-xl font-bold">AI 맞춤형 학습 자료 생성기</h2>
              <p className="text-sm opacity-90">선생님이 지도에 남긴 핀들을 분석하고 있습니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          <div className="space-y-6">
            
            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                {error}
              </div>
            )}

            {/* Step 0: Analyzing */}
            {generating && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">🤖</div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 w-full max-w-md">
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                    {pins.length}개의 탐방 데이터를 분석 중입니다...
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Analysis Complete */}
            {!generating && step >= 1 && material && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">✓</div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-emerald-200">
                  <p className="text-sm text-gray-700">
                    분석 완료! <strong>{pins.length}개</strong>의 탐방 데이터를 바탕으로 학습 자료를 생성했습니다.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Generated Content */}
            {step >= 2 && material && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">📚</div>
                <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-sm border border-emerald-200 w-full">
                  <h3 className="font-bold text-lg text-emerald-800 mb-3 border-b pb-2">{material.title}</h3>

                  <div className="prose prose-sm max-w-none text-gray-700 max-h-[300px] overflow-y-auto mb-4">
                    <p className="mb-4"><strong>📍 개요:</strong> {material.overview}</p>

                    {material.sections.map((section, idx) => (
                      <div key={idx} className="mb-4">
                        <h4 className="font-bold text-gray-900 mb-2">{idx + 1}. {section.heading}</h4>
                        <p className="text-sm mb-2">{section.content}</p>
                        {section.activity && (
                          <p className="text-sm italic text-gray-600">💡 활동: {section.activity}</p>
                        )}
                      </div>
                    ))}

                    {material.keyQuestions.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <p className="font-bold text-blue-900 mb-2">생각해볼 질문:</p>
                        <ul className="text-sm text-blue-800 list-disc pl-5">
                          {material.keyQuestions.slice(0, 3).map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t flex justify-end gap-2">
                    <button
                      onClick={() => alert('PDF 저장 기능은 Phase 3에서 구현됩니다.')}
                      className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                    >
                      PDF로 저장
                    </button>
                    <button
                      onClick={() => alert('학생 배포 기능은 Phase 3에서 구현됩니다.')}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                    >
                      배포하기
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t flex gap-2">
          {!generating && !material && (
            <button
              onClick={handleGenerateMaterial}
              disabled={pins.length === 0 || !tenantId}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {pins.length === 0 ? '탐방 데이터가 없습니다' : `학습 자료 생성 (${pins.length}개 탐방)`}
            </button>
          )}
          {generating && (
            <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin"></span>
              생성 중...
            </div>
          )}
          {material && (
            <button
              onClick={handleGenerateMaterial}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
            >
              다른 자료 생성하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
