'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Tenant, Pin } from '@/lib/types';
import { generateNeighborhoodBookPDF } from '@/lib/pdf/generate-neighborhood-book';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  pins: Pin[];
  locale: string;
}

export default function PdfExportModal({
  isOpen,
  onClose,
  tenant,
  pins,
  locale,
}: PdfExportModalProps) {
  const [title, setTitle] = useState('');
  const [schoolYear, setSchoolYear] = useState<number | null>(null);
  const [grade, setGrade] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !tenant) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const htmlContent = generateNeighborhoodBookPDF({
        tenant,
        pins,
        locale,
        title: title || undefined,
        schoolYear: schoolYear || undefined,
        grade: grade || undefined,
      });

      // Blob으로 변환
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // 새 창에서 열기 (사용자가 인쇄할 수 있도록)
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }

      // 또는 직접 다운로드
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = `${tenant.name.ko || 'neighborhood-book'}.html`;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);

      onClose();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const tenantName = typeof tenant.name === 'string' ? tenant.name : tenant.name.ko || '우리 학교';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-1">📕 우리 동네 책</h2>
          <p className="text-gray-600 text-sm mb-6">
            탐방한 장소들을 책으로 만들기
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">책 제목</label>
              <Input
                placeholder={`${tenantName} 우리 동네 책`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">학년도</label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={schoolYear || ''}
                  onChange={(e) => setSchoolYear(e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">학년</label>
                <Input
                  type="number"
                  placeholder="3"
                  min="1"
                  max="6"
                  value={grade || ''}
                  onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded text-sm">
              <p className="font-medium mb-1">포함될 내용</p>
              <ul className="text-gray-700 space-y-1">
                <li>✓ 표지 및 차례</li>
                <li>✓ 탐방 장소 {pins.length}곳</li>
                <li>✓ 각 장소의 설명</li>
                <li>✓ 생성 날짜</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || pins.length === 0}
              className="flex-1"
            >
              {isGenerating ? '생성 중...' : '📖 책 만들기'}
            </Button>
          </div>

          {pins.length === 0 && (
            <p className="text-red-600 text-sm text-center mt-2">
              탐방 장소를 먼저 추가해주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
