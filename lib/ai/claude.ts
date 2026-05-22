import Anthropic from '@anthropic-ai/sdk';
import type { Pin } from '@/lib/firebase/models';

const client = new Anthropic();

export interface GenerateLearningMaterialRequest {
  tenantName: string;
  pins: Array<{
    name: string;
    description?: string;
    layerId: string;
    images?: string[];
  }>;
  locale?: string;
  focusAreas?: string[];
  gradeLevel?: string;
}

export interface LearningMaterial {
  title: string;
  overview: string;
  sections: Array<{
    heading: string;
    content: string;
    activity?: string;
  }>;
  keyQuestions: string[];
  suggestedResources: string[];
}

export async function generateLearningMaterial(
  request: GenerateLearningMaterialRequest
): Promise<LearningMaterial> {
  const { tenantName, pins, locale = 'ko', focusAreas = [], gradeLevel = '초등학생' } = request;

  const pinSummary = pins
    .map((p, idx) => `${idx + 1}. ${p.name}${p.description ? ': ' + p.description : ''}`)
    .join('\n');

  const prompt = `당신은 한국 교육 전문가입니다. 학생 탐방 활동을 바탕으로 창의적이고 교육적인 학습 자료를 만드세요.

학교: ${tenantName}
학생 수준: ${gradeLevel}
${focusAreas.length > 0 ? `초점 영역: ${focusAreas.join(', ')}` : ''}

탐방 장소들:
${pinSummary}

다음 JSON 형식으로 응답하세요:
{
  "title": "학습 자료 제목 (한국어)",
  "overview": "3-4문장의 개요",
  "sections": [
    {
      "heading": "섹션 제목",
      "content": "2-3문단의 내용",
      "activity": "선택사항: 학습 활동 제안"
    }
  ],
  "keyQuestions": ["학생들이 생각해볼 질문들 3-5개"],
  "suggestedResources": ["추천 학습 자료/사이트 3-5개"]
}

응답은 반드시 유효한 JSON이어야 합니다.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response');
  }

  const material = JSON.parse(jsonMatch[0]) as LearningMaterial;
  return material;
}

export async function generatePinDescription(
  pinName: string,
  context: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `당신은 교육 가이드입니다. 다음 장소에 대해 학생 수준의 설명을 한국어로 만드세요 (3-4문장).

장소: ${pinName}
맥락: ${context}

설명만 제공하세요.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  return content.text;
}
