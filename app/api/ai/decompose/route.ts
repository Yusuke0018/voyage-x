import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { milestone, apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }
    
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    const prompt = `
中間目標: ${milestone.title}
説明: ${milestone.description || 'なし'}
期限: ${milestone.targetDate}

この中間目標を達成するための具体的なタスクに分解してください。
タスクは実行可能で、明確で、測定可能なものにしてください。

以下のJSON形式で応答してください：
{
  "tasks": [
    {
      "title": "タスク名",
      "description": "説明",
      "priority": "high/medium/low",
      "dependencies": []
    }
  ],
  "reasoning": "分解の理由とアプローチ"
}
`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'あなたはプロジェクトマネージャーで、目標を具体的なタスクに分解する専門家です。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI decompose error:', error);
    return NextResponse.json(
      { error: 'Failed to decompose milestone' },
      { status: 500 }
    );
  }
}