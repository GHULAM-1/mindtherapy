import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Increase timeout for audio generation (max 60 seconds for Amplify)
export const maxDuration = 60; // seconds
export const dynamic = 'force-dynamic'; // Disable static optimization

export async function POST(req: NextRequest) {
  try {
    // Get API key at runtime (not build time)
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_ELEVENLABS_API_KEY;

    // Validate API key exists
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY or NEXT_ELEVENLABS_API_KEY is not set');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('ELEVEN') || k.includes('SUPABASE')));
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    // Initialize client at request time with runtime environment variables
    const elevenlabs = new ElevenLabsClient({
      apiKey: apiKey,
    });

    const { text, questionId, emotionId } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check database-linked cache (for emotion cards/questions only)
    let cachedAudioUrl: string | null = null;

    if (questionId) {
      const { data: question, error: dbError } = await supabase
        .from('emotion_questions')
        .select('audio_url')
        .eq('id', questionId)
        .single();

      if (!dbError && question?.audio_url) {
        cachedAudioUrl = question.audio_url;
      }
    } else if (emotionId) {
      const { data: emotion, error: dbError } = await supabase
        .from('emotion_cards')
        .select('audio_url')
        .eq('id', emotionId)
        .single();

      if (!dbError && emotion?.audio_url) {
        cachedAudioUrl = emotion.audio_url;
      }
    }

    // If we have a cached audio URL from database, fetch it from Supabase Storage and return it
    if (cachedAudioUrl) {
      console.log('✅ Using database-linked cache:', cachedAudioUrl);

      try {
        const audioResponse = await fetch(cachedAudioUrl);
        if (audioResponse.ok) {
          const audioBuffer = await audioResponse.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'X-Cache-Status': 'HIT-DATABASE',
            },
          });
        }
      } catch (fetchError) {
        console.error('Error fetching cached audio:', fetchError);
        // Fall through to generate new audio
      }
    }

    // Generate audio using ElevenLabs with Portuguese voice
    console.log('🎙️ Generating fresh audio with ElevenLabs for text:', text);

    const audio = await elevenlabs.textToSpeech.convert(
      'bIHbv24MWmeRgasZH58o', // Adam voice (multilingual, supports Portuguese)
      {
        modelId: 'eleven_multilingual_v2',
        text: text,
        outputFormat: 'mp3_44100_128',
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          speed: 0.75, // Moderately slower for easier comprehension
        },
      }
    );

    console.log('✅ Audio generated successfully with ElevenLabs');

    // Convert the ReadableStream to buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks);
    console.log('Audio buffer size:', audioBuffer.length, 'bytes');

    // Return the audio data as an MP3 response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'X-Cache-Status': 'GENERATED', // Always freshly generated
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);

    // Log detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: 'Failed to generate speech',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}