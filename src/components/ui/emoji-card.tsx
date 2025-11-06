"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

type EmojiCardProps = {
  emoji?: string
  imageUrl?: string
  text: string
  className?: string
  isCorrect?: boolean
  isWrong?: boolean
  showListenButton?: boolean
  alwaysShowListen?: boolean
  emotionId?: string // ID for caching audio
}

export function EmojiCard({ emoji, imageUrl, text, className, isCorrect, isWrong, showListenButton, alwaysShowListen, emotionId }: EmojiCardProps) {
  const [isPlaying, setIsPlaying] = React.useState(false)

  const handleListen = async (e: React.MouseEvent) => {
    // Stop the click from bubbling up to parent elements
    e.stopPropagation()

    if (isPlaying) return

    try {
      setIsPlaying(true)

      // Call TTS API with emotionId for caching
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          emotionId: emotionId || undefined
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      // Get audio blob and play it
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
    }
  }

  return (
    <Card
      className={cn(
        "h-full overflow-hidden relative transition-all duration-200 py-0 pb-2",
        className
      )}
    >
      {/* Checkmark or X indicator */}
      {isCorrect && (
        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 z-10">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
      {isWrong && (
        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1 z-10">
          <X className="h-4 w-4 text-white" />
        </div>
      )}

      <CardContent className="h-full flex flex-col items-center justify-center m-0 p-0">
        {imageUrl ? (
          <div className="relative w-48 h-48">
            <Image
              src={imageUrl}
              alt={text}
              fill
              className="object-contain"
              sizes="320px"
            />
          </div>
        ) : emoji ? (
          <div className="text-6xl mb-3">{emoji}</div>
        ) : null}
        <p className="text-center text-lg font-semibold ">{text}</p>
        {(showListenButton || alwaysShowListen) && (
          <Button onClick={handleListen} variant="outline" size="sm" className="mt-2" disabled={isPlaying}>
            <Volume2 className={`mr-2 h-4 w-4 ${isPlaying ? 'animate-pulse' : ''}`} />
            {isPlaying ? 'A tocar...' : 'Ouvir'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

