"use client";

/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPatient } from "@/app/actions/patients";
import { Volume2, LogOut, Info, Sparkles, X } from "lucide-react";
import PinModal from "@/components/PinModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Patient {
  id: string;
  name: string;
  avatar_url?: string;
  total_sessions: number;
  points?: number;
  level?: number;
  streak?: number;
}

interface GameCategory {
  id: number;
  name: string;
  gamesCount: number;
  bgColor: string;
  img_url: string;
}

interface Game {
  id: number;
  name: string;
  hasAudio: boolean;
  img_url: string;
}

interface AlertNotification {
  type: "info" | "coming-soon";
  message: string;
  title: string;
}

export default function PatientPlayPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExitPinModal, setShowExitPinModal] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [alertNotification, setAlertNotification] =
    useState<AlertNotification | null>(null);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  async function loadPatient() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/dashboard");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("global_child_mode_pin")
        .eq("id", user.id)
        .single();

      const sessionPin = sessionStorage.getItem(`child_mode_pin_${patientId}`);
      if (
        !profile?.global_child_mode_pin ||
        !sessionPin ||
        sessionPin !== profile.global_child_mode_pin
      ) {
        router.push(`/dashboard/patient/${patientId}`);
        return;
      }

      setStoredPin(profile.global_child_mode_pin);

      const result = await getPatient(patientId);
      if (result.success && result.data) {
        const p = result.data;
        setPatient({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url || undefined,
          total_sessions: p.total_sessions,
          points: 250,
          level: 5,
          streak: 83,
        });
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error loading patient:", error);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  const showAlert = (
    title: string,
    message: string,
    type: "info" | "coming-soon" = "info"
  ) => {
    setAlertNotification({ title, message, type });
    setTimeout(() => setAlertNotification(null), 5000);
  };

  const handleExitToCaregiver = () => {
    setShowExitPinModal(true);
  };

  const handleExitPinSuccess = () => {
    sessionStorage.removeItem(`child_mode_pin_${patientId}`);
    setShowExitPinModal(false);
    router.push(`/dashboard/patient/${patientId}`);
  };

  const categories: GameCategory[] = [
    {
      id: 1,
      name: "Communication",
      gamesCount: 5,
      bgColor: "bg-amber-50",
      img_url:
        "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Communication.png",
    },
    { id: 2, name: "Feelings", gamesCount: 5, bgColor: "bg-pink-50", img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Feelings.png" },
    { id: 3, name: "Puzzles & Logic", gamesCount: 5, bgColor: "bg-purple-50", img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Puzzles-Logic.png" },
    { id: 4, name: "Daily Routines", gamesCount: 5, bgColor: "bg-green-50", img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Daily-Routines.png" },
    { id: 5, name: "Social Stories", gamesCount: 5, bgColor: "bg-blue-50", img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Social-Stories.png" },
    { id: 6, name: "Drawing", gamesCount: 5, bgColor: "bg-rose-50", img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Drawing.png" },
  ];

  const suggestedGames: Game[] = [
    { id: 1, name: "Morning Puzzle", hasAudio: true,img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Morning-Puzzle.png"  },
    { id: 2, name: "Story Builder", hasAudio: true, img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Story-Builder.png"},
    { id: 3, name: "Pattern Place", hasAudio: true, img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Pattern-Place.png"},
  ];

  const playAgainGames: Game[] = [
    { id: 2, name: "Story Builder", hasAudio: true, img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Story-Builder.png"},
    { id: 1, name: "Morning Puzzle", hasAudio: true, img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Morning-Puzzle.png"},
    { id: 3, name: "Pattern Place", hasAudio: true, img_url: "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/Pattern-Place.png"},
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E2F7FF] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-xl sm:text-2xl text-purple-600 font-bold">
            A carregar...
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#E2F7FF] relative">
      {/* Alert Notification */}
      {alertNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-top-5">
          <div
            className={cn(
              "relative rounded-2xl shadow-2xl border-2 p-6",
              alertNotification.type === "coming-soon"
                ? "bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 border-purple-300"
                : "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300"
            )}
          >
            <button
              onClick={() => setAlertNotification(null)}
              className={cn(
                "absolute top-3 right-3 p-1.5 rounded-full transition-colors",
                alertNotification.type === "coming-soon"
                  ? "hover:bg-purple-200/50 text-purple-600"
                  : "hover:bg-blue-200/50 text-blue-600"
              )}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4 pr-8">
              <div
                className={cn(
                  "p-3 rounded-xl flex-shrink-0",
                  alertNotification.type === "coming-soon"
                    ? "bg-gradient-to-br from-purple-400 to-pink-400"
                    : "bg-gradient-to-br from-blue-400 to-blue-500"
                )}
              >
                {alertNotification.type === "coming-soon" ? (
                  <Sparkles className="h-6 w-6 text-white" />
                ) : (
                  <Info className="h-6 w-6 text-white" />
                )}
              </div>

              <div className="flex-1 pt-0.5">
                <h3
                  className={cn(
                    "text-xl font-bold mb-2",
                    alertNotification.type === "coming-soon"
                      ? "text-purple-900"
                      : "text-blue-900"
                  )}
                >
                  {alertNotification.title}
                </h3>
                <p
                  className={cn(
                    "text-base leading-relaxed",
                    alertNotification.type === "coming-soon"
                      ? "text-purple-800"
                      : "text-blue-800"
                  )}
                >
                  {alertNotification.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Background - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-0 pointer-events-none">
        <img src="/gamehub-after.png" alt="" className="w-full h-auto" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header with Patient Info and Badges */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 pt-3 sm:pt-5 pb-6 sm:pb-10">
          <div className="bg-white/80 backdrop-blur rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Patient Avatar and Name */}
              <div className="flex items-center gap-3 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  Hi, {patient.name.split(" ")[0]}!
                </h1>
              </div>

              {/* Action Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-5 w-full sm:w-auto">
                {/* I want to talk button */}
                <button
                  onClick={() => router.push(`/dashboard/patient/${patientId}/play/aac`)}
                  className="relative h-10 sm:h-11 px-4 sm:px-6 rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] overflow-hidden flex-1 sm:flex-none"
                >
                  <div className="absolute inset-[-2px] bg-white rounded-full" />
                  <div
                    className="absolute inset-0 rounded-full border-[3px] border-white/20 overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(to bottom, #4ade80 0%, #22c55e 100%)",
                    }}
                  >
                    {/* Sparkle background pattern */}
                    <div
                      className="absolute inset-0 opacity-100"
                      style={{
                        backgroundImage: "url('/button-bg.svg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-[29px] opacity-30"
                      style={{
                        background:
                          "linear-gradient(to bottom, white 0%, transparent 100%)",
                      }}
                    />
                  </div>
                  <span
                    className="relative z-10 text-white text-sm sm:text-base font-bold"
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      textShadow: "0px 2px 0px rgba(0,0,0,0.15)",
                    }}
                  >
                    I want to talk
                  </span>
                </button>

                {/* Coins button */}
                <button className="relative h-10 sm:h-11 px-4 rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] overflow-hidden flex-shrink-0">
                  <div className="absolute inset-[-2px] bg-white rounded-full" />
                  <div
                    className="absolute inset-0 rounded-full border-[3px] border-white/20 overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(to bottom, #fbbf24 0%, #f59e0b 100%)",
                    }}
                  >
                    {/* Sparkle background pattern */}
                    <div
                      className="absolute inset-0 opacity-100"
                      style={{
                        backgroundImage: "url('/button-bg.svg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-[29px] opacity-30"
                      style={{
                        background:
                          "linear-gradient(to bottom, white 0%, transparent 100%)",
                      }}
                    />
                  </div>
                  <span className="relative z-10 flex items-center gap-2">
                    <Image
                      src="/coin.svg"
                      alt="Coin"
                      width={24}
                      height={24}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <span
                      className="text-white text-sm sm:text-base font-bold"
                      style={{
                        fontFamily: "Nunito, sans-serif",
                        textShadow: "0px 2px 0px rgba(0,0,0,0.15)",
                      }}
                    >
                      {patient.points}
                    </span>
                  </span>
                </button>

                {/* Streak button */}
                <button className="relative h-10 sm:h-11 px-4 rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] overflow-hidden flex-shrink-0">
                  <div className="absolute inset-[-2px] bg-white rounded-full" />
                  <div
                    className="absolute inset-0 rounded-full border-[3px] border-white/20 overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(to bottom, #60a5fa 0%, #3b82f6 100%)",
                    }}
                  >
                    {/* Sparkle background pattern */}
                    <div
                      className="absolute inset-0 opacity-100"
                      style={{
                        backgroundImage: "url('/button-bg.svg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-[29px] opacity-30"
                      style={{
                        background:
                          "linear-gradient(to bottom, white 0%, transparent 100%)",
                      }}
                    />
                  </div>
                  <span className="relative z-10 flex items-center gap-2">
                    <Image
                      src="/star-coin.svg"
                      alt="Star"
                      width={24}
                      height={24}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <span
                      className="text-white text-sm sm:text-base font-bold"
                      style={{
                        fontFamily: "Nunito, sans-serif",
                        textShadow: "0px 2px 0px rgba(0,0,0,0.15)",
                      }}
                    >
                      Lvl {patient.level}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 px-2 sm:px-8">
            Categories
          </h2>

          <div className="relative px-2 sm:px-8">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 sm:-ml-4 lg:-ml-8">
                {categories.map((category) => (
                  <CarouselItem
                    key={category.id}
                    className="pl-2 sm:pl-4 lg:pl-8 basis-full sm:basis-1/2 lg:basis-auto"
                  >
                    <Card
                      className={cn(
                        "relative w-full lg:w-96 h-[320px] sm:h-[360px] lg:h-[394px] cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1",
                        category.bgColor,
                        "border-none overflow-hidden"
                      )}
                      onClick={() => {
                        if (category.id === 1) {
                          router.push(
                            `/dashboard/patient/${patientId}/play/communication`
                          );
                        } else if (category.id === 2) {
                          router.push(
                            `/dashboard/patient/${patientId}/play/emotions`
                          );
                        } else {
                          showAlert(
                            "Coming Soon! ✨",
                            `${category.name} games are being prepared for you. Check back soon!`,
                            "coming-soon"
                          );
                        }
                      }}
                    >
                      {/* Shadow circle at bottom */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[400px] h-20 sm:h-24 bg-gradient-to-t from-gray-200/40 to-transparent rounded-full blur-2xl" />

                      {/* Game illustration placeholder */}
                      <div className="relative w-full h-[180px] sm:h-[200px] lg:h-[221px] flex items-center justify-center p-4 sm:p-5">
                        <div className="relative w-full h-full bg-white/50 rounded-2xl flex items-center justify-center">
                          <Image
                            src={category.img_url}
                            alt={"communication"}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                          />
                        </div>
                      </div>

                      {/* Category info */}
                      <div className="absolute bottom-0 left-0 right-0 px-8 sm:px-12 lg:px-16 pb-8 sm:pb-12 lg:pb-16">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3 sm:mb-4">
                          {category.name}
                        </h3>
                        <div className="flex justify-center">
                          <Badge
                            variant="outline"
                            className="bg-white/80 backdrop-blur text-sm"
                          >
                            {category.gamesCount} games
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>
        </section>

        {/* Suggested Section */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 px-2 sm:px-8">
            Suggested
          </h2>

          <div className="relative px-2 sm:px-8">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 sm:-ml-4 lg:-ml-8">
                {suggestedGames.map((game) => (
                  <CarouselItem
                    key={game.id}
                    className="pl-2 sm:pl-4 lg:pl-8 basis-full sm:basis-1/2 lg:basis-auto"
                  >
                    <Card className="relative w-full lg:w-96 h-[300px] sm:h-[340px] lg:h-[369px] cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 bg-blue-50 border-none overflow-hidden">
                      {/* Shadow circle at bottom */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[400px] h-20 sm:h-24 bg-gradient-to-t from-gray-200/40 to-transparent rounded-full blur-2xl" />

                      {/* Game illustration placeholder */}
                      <div className="relative w-full h-[160px] sm:h-[180px] lg:h-[203px] flex items-center justify-center p-4 sm:p-5">
                        <div className="relative w-full h-full bg-white/50 rounded-2xl flex items-center justify-center">
                          <Image
                            src={game.img_url}
                            alt={"communication"}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                          />
                        </div>
                      </div>

                      {/* Game info */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-5 lg:pb-6">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-4 sm:mb-5 lg:mb-6">
                          {game.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <Button
                            className="mx-auto bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                            onClick={() =>
                              showAlert(
                                "Get Ready! 🎮",
                                `${game.name} will be available soon. We're adding the finishing touches!`,
                                "coming-soon"
                              )
                            }
                          >
                            <span className="mr-2">▶</span>
                            PLAY
                          </Button>

                          {game.hasAudio && (
                            <Button
                              size="icon"
                              variant="outline"
                              className="ml-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-orange-400 hover:bg-orange-500 border-none text-white"
                            >
                              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 hidden sm:flex" />
              <CarouselNext className="right-0 hidden sm:flex" />
            </Carousel>
          </div>
        </section>

        {/* Play Again Section */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 px-2 sm:px-8">
            Play Again
          </h2>

          <div className="relative px-2 sm:px-8">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 sm:-ml-4 lg:-ml-8">
                {playAgainGames.map((game, index) => (
                  <CarouselItem
                    key={`play-again-${index}`}
                    className="pl-2 sm:pl-4 lg:pl-8 basis-full sm:basis-1/2 lg:basis-auto"
                  >
                    <Card className="relative w-full lg:w-96 h-[300px] sm:h-[340px] lg:h-[369px] cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 bg-blue-50 border-none overflow-hidden">
                      {/* Shadow circle at bottom */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[400px] h-20 sm:h-24 bg-gradient-to-t from-gray-200/40 to-transparent rounded-full blur-2xl" />

                      {/* Game illustration placeholder */}
                      <div className="relative w-full h-[160px] sm:h-[180px] lg:h-[203px] flex items-center justify-center p-4 sm:p-5">
                        <div className="relative w-full h-full bg-white/50 rounded-2xl flex items-center justify-center">
                          <Image
                            src={game.img_url}
                            alt={"communication"}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                          />
                        </div>
                      </div>

                      {/* Game info */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-5 lg:pb-6">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-4 sm:mb-5 lg:mb-6">
                          {game.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <Button
                            className="mx-auto bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
                            onClick={() =>
                              showAlert(
                                "Get Ready! 🎮",
                                `${game.name} will be available soon. We're adding the finishing touches!`,
                                "coming-soon"
                              )
                            }
                          >
                            <span className="mr-2">▶</span>
                            PLAY
                          </Button>

                          {game.hasAudio && (
                            <Button
                              size="icon"
                              variant="outline"
                              className="ml-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-orange-400 hover:bg-orange-500 border-none text-white"
                            >
                              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 hidden sm:flex" />
              <CarouselNext className="right-0 hidden sm:flex" />
            </Carousel>
          </div>
        </section>

        {/* Exit Button (Caregiver Access) */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 pb-6 sm:pb-8 flex justify-center">
          <button
            onClick={handleExitToCaregiver}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur text-gray-600 rounded-full hover:bg-white transition-colors text-xs sm:text-sm shadow-md"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            Voltar para Cuidador
          </button>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={showExitPinModal}
        onClose={() => setShowExitPinModal(false)}
        onSuccess={handleExitPinSuccess}
        mode="verify"
        title="Verificar PIN"
        description="Introduz o PIN para voltar à área do cuidador"
        storedPin={storedPin || ""}
      />
    </div>
  );
}
