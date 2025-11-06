import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', response.status, errorData)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    try {
      // Clean the response content - remove markdown code blocks if present
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '')
      }
      
      // Parse the JSON response from GPT
      const suggestions = JSON.parse(cleanContent)
      return NextResponse.json(suggestions)
    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError)
      console.error('GPT response content:', content)
      return NextResponse.json(
        { error: 'Invalid JSON response from GPT' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in GPT suggestions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}