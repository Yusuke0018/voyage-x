import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { goal, milestones, tasks, currentProgress, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const prompt = `
目標: ${goal.title}
説明: ${goal.description}
期限: ${new Date(goal.targetDate).toLocaleDateString('ja-JP')}
現在の進捗率: ${currentProgress}%

マイルストーン:
${milestones.map((m: any) => `- ${m.title} (${m.status})`).join('\n')}

遅延しているタスク:
${tasks.filter((t: any) => t.status === 'blocked' || new Date(t.dueDate) < new Date()).map((t: any) => `- ${t.title}`).join('\n')}

以下の観点でリルート提案を3つ作成してください:
1. タスクの優先順位調整案
2. マイルストーンの期限調整案
3. 代替アプローチの提案

各提案に理由と具体的なアクション項目を含めてください。
JSONフォーマットで返してください。
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたは目標達成を支援する航海アドバイザーです。計画の遅延に対して実現可能な調整案を提供します。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const proposals = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Reroute API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reroute proposals' },
      { status: 500 }
    );
  }
}