import type { Pin, Tenant } from '@/lib/types';

export interface NeighborhoodBookOptions {
  tenant: Tenant;
  pins: Pin[];
  locale: string;
  title?: string;
  schoolYear?: number;
  grade?: number;
}

export function generateNeighborhoodBookPDF(options: NeighborhoodBookOptions): string {
  const { tenant, pins, locale, title, schoolYear, grade } = options;
  const tenantName = typeof tenant.name === 'string' ? tenant.name : tenant.name.ko || '우리 학교';
  const bookTitle = title || `${tenantName} 우리 동네 책`;

  // HTML 콘텐츠 생성
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${bookTitle}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }

        @page {
          size: A4;
          margin: 2cm;
        }

        .page-break {
          page-break-after: always;
        }

        .cover {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          page-break-after: always;
        }

        .cover h1 {
          font-size: 3em;
          margin-bottom: 1em;
          font-weight: 700;
        }

        .cover p {
          font-size: 1.2em;
          margin-bottom: 0.5em;
          opacity: 0.9;
        }

        .cover .subtitle {
          font-size: 1.5em;
          margin-top: 2em;
          font-weight: 300;
        }

        .toc {
          page-break-after: always;
        }

        .toc h2 {
          font-size: 1.8em;
          margin-bottom: 1.5em;
          color: #667eea;
        }

        .toc-entry {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5em;
          font-size: 1em;
          border-bottom: 1px dotted #ddd;
          padding-bottom: 0.3em;
        }

        .pin-card {
          page-break-inside: avoid;
          margin-bottom: 2em;
          padding: 1.5em;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: #fafafa;
        }

        .pin-card h3 {
          font-size: 1.4em;
          color: #667eea;
          margin-bottom: 0.5em;
        }

        .pin-card .location {
          font-size: 0.9em;
          color: #666;
          margin-bottom: 0.8em;
          font-style: italic;
        }

        .pin-card .description {
          font-size: 1em;
          line-height: 1.8;
          color: #444;
          margin-bottom: 0.8em;
        }

        .pin-card .source {
          font-size: 0.85em;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 0.5em;
        }

        .footer {
          text-align: center;
          margin-top: 2em;
          padding-top: 1em;
          border-top: 2px solid #ddd;
          color: #666;
          font-size: 0.9em;
        }

        .generated-info {
          color: #999;
          font-size: 0.8em;
          margin-top: 0.5em;
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="cover">
        <h1>${bookTitle}</h1>
        <p>${tenantName}</p>
        ${schoolYear ? `<p>2024년도${grade ? ` ${grade}학년` : ''}</p>` : ''}
        <p class="subtitle">우리가 탐방한 소중한 장소들</p>
      </div>

      <!-- Table of Contents -->
      <div class="toc page-break">
        <h2>차례</h2>
        ${pins.map((pin, idx) => `
          <div class="toc-entry">
            <span>${idx + 1}. ${getLocalizedText(pin.name, locale)}</span>
            <span>${idx + 1}</span>
          </div>
        `).join('')}
      </div>

      <!-- Pin Cards -->
      ${pins.map((pin, idx) => `
        <div class="pin-card ${idx > 0 ? 'page-break' : ''}">
          <h3>${idx + 1}. ${getLocalizedText(pin.name, locale)}</h3>
          <div class="location">
            📍 위치: ${pin.location.lat.toFixed(4)}, ${pin.location.lng.toFixed(4)}
          </div>
          <div class="description">
            ${getLocalizedText(pin.description, locale) || '(설명이 없습니다)'}
          </div>
          <div class="source">
            출처: ${pin.source?.adapter || pin.source?.apiName || '수동 입력'}
            ${pin.createdBy !== 'system' ? ` · 작성: ${pin.createdBy}` : ''}
          </div>
        </div>
      `).join('')}

      <!-- Back Cover -->
      <div class="cover page-break">
        <h1>함께 만든 우리 동네</h1>
        <p>${tenantName}</p>
        <p class="subtitle">탐방 장소 ${pins.length}곳</p>
        <div class="generated-info">
          ${new Date().toLocaleDateString('ko-KR')} 생성
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
}

function getLocalizedText(text: any, locale: string): string {
  if (typeof text === 'string') return text;
  if (!text) return '';

  const localeMap: Record<string, keyof typeof text> = {
    'ko': 'ko',
    'ja': 'ja',
    'en': 'en',
    'ko-KR': 'ko',
    'ja-JP': 'ja',
    'en-US': 'en',
  };

  const key = localeMap[locale] || 'ko';
  return text[key] || text.ko || Object.values(text)[0] || '';
}
