"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Volume2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AACMasterCategoryWithCards,
  AACMasterCard,
} from "@/types/aac.types";

// Supabase response types
interface SupabaseCategoryResponse {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cards: SupabaseCardResponse[];
}

interface SupabaseCardResponse {
  id: string;
  category_id: string;
  text: string;
  image_url: string;
  tags: string[];
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AACPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const supabase = createClient();

  // State
  const [categories, setCategories] = useState<AACMasterCategoryWithCards[]>(
    []
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

  useEffect(() => {
    loadAACData();
  }, []);

  async function loadAACData() {
    setIsLoading(true);
    try {
      // Fetch categories with cards from master tables
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("aac_master_categories")
        .select(
          `
          *,
          cards:aac_master_cards(*)
        `
        )
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (categoriesError) {
        console.error("Error loading categories:", categoriesError);
        return;
      }

      // Transform and filter active cards
      const transformedCategories: AACMasterCategoryWithCards[] = (
        categoriesData as SupabaseCategoryResponse[]
      ).map((cat) => ({
        ...cat,
        cards: cat.cards
          .filter((card) => card.is_active)
          .sort((a, b) => a.order_index - b.order_index),
      }));

      setCategories(transformedCategories);

      // Set first category as selected by default
      if (transformedCategories.length > 0) {
        setSelectedCategoryId(transformedCategories[0].id);
      }
    } catch (error) {
      console.error("Unexpected error loading AAC data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCardClick(card: AACMasterCard) {
    // Record impression for analytics
    try {
      await supabase.from("aac_card_impressions").insert({
        patient_id: patientId,
        card_id: card.id,
        clicked_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error recording impression:", error);
    }

    // Play audio
    await playCardAudio(card);
  }

  async function playCardAudio(card: AACMasterCard) {
    if (playingCardId === card.id) return; // Already playing

    try {
      setPlayingCardId(card.id);

      // Use TTS API for high-quality audio
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: card.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setPlayingCardId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingCardId(null);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setPlayingCardId(null);
    }
  }

  function handleAudioButtonClick(e: React.MouseEvent, card: AACMasterCard) {
    e.stopPropagation(); // Prevent card click
    playCardAudio(card);
  }

  function handleBackClick() {
    setIsNavigating(true);
    router.push(`/dashboard/patient/${patientId}/play`);
  }

  // Get cards for selected category (responsive limits)
  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );
  const displayCards = selectedCategory?.cards.slice(0, 6) || [];

  // Loading state
  if (isLoading || isNavigating) {
    return (
      <div className="min-h-screen bg-[#d9f0e3] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#f39f46] mb-4"></div>
          <p className="text-2xl text-gray-800 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d9f0e3] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center px-2 sm:px-4 lg:px-5 py-3 shrink-0">
        <div className="backdrop-blur-[62.5px] bg-white/80 rounded-[16px] sm:rounded-[20px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.15)] px-3 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 flex items-center justify-between w-full max-w-[1280px]">
          <h1 className="font-['Nunito'] font-bold text-lg sm:text-xl md:text-2xl lg:text-[32px] text-[#0d0d0f] [text-shadow:0px_2px_0px_rgba(0,0,0,0.15)]">
            AAC Board
          </h1>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
            {/* Back Button */}
            <Button
              className="relative h-[42px] sm:h-[46px] md:h-[50px] px-[11px] sm:px-[12px] md:px-[13px] rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] bg-[#4694f3] hover:bg-[#3a7dd9] border-[3px] border-white/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
              <Image
                src="/setting.svg"
                alt="Settings"
                width={24}
                height={24}
                className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6"
              />
            </Button>

            {/* Settings/Volume Button */}
            <Button className="relative h-[42px] sm:h-[46px] md:h-[50px] px-[11px] sm:px-[12px] md:px-[13px] rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] bg-[#f39f46] hover:bg-[#d9883d] border-[3px] border-white/20 overflow-hidden" onClick={handleBackClick}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
              <Image
                src="/exit.svg"
                alt="Exit"
                width={24}
                height={24}
                className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6"
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-3 py-3 sm:py-4 md:px-6 lg:px-10 md:py-5 pb-6 sm:pb-8 md:pb-10">
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 lg:gap-8 w-full max-w-[1280px]">
          {/* Category Tabs */}
          {/* Category Tabs */}
          <div className="bg-white rounded-[12px] sm:rounded-[14px] md:rounded-[16px] shadow-[0px_2.817px_0px_0px_rgba(0,0,0,0.15)] p-1.5 sm:p-2 md:p-4">
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={cn(
                    "flex-shrink-0 min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px] xl:min-w-[200px]",
                    "h-10 sm:h-12 md:h-[56px] lg:h-[60px]",
                    "rounded-[10px] sm:rounded-[12px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.15)]",
                    "px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 backdrop-blur-sm transition-all",
                    "flex items-center justify-center",
                    "relative",
                    selectedCategoryId === category.id
                      ? "bg-[#d9f0e3]"
                      : "bg-[#dfdfdf]"
                  )}
                >
                  <div className="font-['Nunito'] font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-[18px] text-black text-center [text-shadow:0px_1.408px_0px_rgba(0,0,0,0.15)] truncate">
                    {category.display_name}
                  </div>
                  <div className="absolute inset-0 pointer-events-none shadow-[0px_0px_8px_0px_inset_rgba(255,255,255,0.16)] rounded-[10px] sm:rounded-[12px]" />
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="bg-white rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[32px] shadow-[0px_2.817px_0px_0px_rgba(0,0,0,0.15)] p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {displayCards.map((card) => (
                <div
                  key={card.id}
                  className="relative bg-white border border-[#9e9e9e] rounded-[10px] sm:rounded-[12px] md:rounded-[14.083px] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="flex flex-col items-center justify-center gap-2 sm:gap-[11.266px] px-3 sm:px-4 md:px-[22.533px] pt-4 sm:pt-5 md:pt-[28.166px] pb-3 sm:pb-4 md:pb-[22.533px]">
                    {/* Card Image */}
                    <div className="h-[80px] sm:h-[100px] md:h-[120px] lg:h-[140px] w-full relative flex items-center justify-center">
                      {card.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.image_url}
                          alt={card.text}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-4xl sm:text-5xl md:text-6xl">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Card Text */}
                    <div className="font-['Nunito'] font-bold text-sm sm:text-base md:text-lg lg:text-[18px] text-black text-center [text-shadow:0px_1.408px_0px_rgba(0,0,0,0.15)] w-full line-clamp-2">
                      {card.text}
                    </div>
                  </div>

                  {/* Audio Button (top-right on every card) */}
                  <button
                    onClick={(e) => handleAudioButtonClick(e, card)}
                    className={cn(
                      "absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 lg:top-5 lg:right-5 w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] md:w-[44px] md:h-[44px] rounded-[6px] sm:rounded-[7px] md:rounded-[8px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.15)]",
                      "flex items-center justify-center transition-all",
                      playingCardId === card.id
                        ? "bg-[#d9883d]"
                        : "bg-[#f39f46] hover:bg-[#e08a39]"
                    )}
                  >
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  </button>
                </div>
              ))}

              {/* Fill empty slots if less than 6 cards */}
              {displayCards.length < 6 &&
                Array.from({ length: 6 - displayCards.length }).map(
                  (_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="bg-white border border-[#9e9e9e] border-dashed rounded-[10px] sm:rounded-[12px] md:rounded-[14.083px] aspect-square opacity-30 hidden sm:block"
                    />
                  )
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
