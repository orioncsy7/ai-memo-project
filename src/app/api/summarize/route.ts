import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  let content: string
  try {
    const body = await request.json()
    content = body.content
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  if (!content || content.trim().length < 20) {
    return NextResponse.json(
      { error: '요약할 내용이 너무 짧습니다. (최소 20자 이상)' },
      { status: 400 },
    )
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = `다음 메모를 한국어로 2-3문장으로 간결하게 요약해 주세요. 핵심 내용만 포함하고 불필요한 설명은 제외하세요.\n\n${content.trim()}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })

    const summary = response.text?.trim()
    if (!summary) {
      return NextResponse.json({ error: '요약 결과를 가져오지 못했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[/api/summarize] Gemini API 오류:', message)
    return NextResponse.json(
      { error: `요약 생성에 실패했습니다: ${message}` },
      { status: 500 },
    )
  }
}
