"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { EmojiCard } from "@/components/ui/emoji-card";
import Confetti from "react-confetti";
import Image from "next/image";

interface EmotionCard {
  id: string;
  emotion_name: string;
  emoji_unicode: string;
  emoji_image_url: string | null;
  display_label: string;
  color_theme: string;
}

interface QuestionOption {
  emotion_id: string;
  is_correct: boolean;
  order_position: number;
  emotion: EmotionCard;
}

interface SupabaseQuestionOption {
  emotion_id: string;
  is_correct: boolean;
  order_position: number;
  emotion_cards: EmotionCard | null;
}

interface QuestionData {
  id: string;
  scenario_text: string;
  scenario_emoji_image_url: string | null;
  explanation_text: string;
  correct_emotion_id: string;
  emotion_question_options: SupabaseQuestionOption[];
}

interface Question {
  id: string;
  scenario_text: string;
  scenario_emoji_image_url: string | null;
  explanation_text: string;
  correct_emotion_id: string;
  options: QuestionOption[];
}

type GameState = "loading" | "ready" | "playing" | "feedback" | "completed";

export default function EmotionsPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const supabase = createClient();

  // User & Session state
  const [userId, setUserId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>("loading");
  // Add this ref to track the current audio instance
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Game data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  console.log(currentQuestionIndex);
  // Stats
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);

  // Answer state
  const [selectedEmotionId, setSelectedEmotionId] = useState<string | null>(
    null
  );
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [isPlayingGreatJob, setIsPlayingGreatJob] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    async function initializeGame() {
      setGameState("loading");
      try {
        // Get user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);

        // Load questions with options and emotion data
        const { data: questionsData, error: questionsError } = await supabase
          .from("emotion_questions")
          .select(
            `
            id,
            scenario_text,
            scenario_emoji_image_url,
            explanation_text,
            correct_emotion_id,
            emotion_question_options(
              emotion_id,
              is_correct,
              order_position,
              emotion_cards(
                id,
                emotion_name,
                emoji_unicode,
                emoji_image_url,
                display_label,
                color_theme
              )
            )
          `
          )
          .eq("is_active", true)
          .order("created_at");

        if (questionsError) {
          console.error("Error loading questions:", questionsError);
          return;
        }

        // Transform the data structure
        const transformedQuestions = (
          questionsData as unknown as QuestionData[]
        ).map((q) => ({
          id: q.id,
          scenario_text: q.scenario_text,
          scenario_emoji_image_url: q.scenario_emoji_image_url,
          explanation_text: q.explanation_text,
          correct_emotion_id: q.correct_emotion_id,
          options: q.emotion_question_options
            .filter((opt) => opt.emotion_cards !== null) // Filter out any null emotion cards
            .map((opt) => ({
              emotion_id: opt.emotion_id,
              is_correct: opt.is_correct,
              order_position: opt.order_position,
              emotion: opt.emotion_cards!, // Non-null assertion since we filtered above
            }))
            .sort((a, b) => a.order_position - b.order_position),
        }));

        setQuestions(transformedQuestions);

        // Load player stats
        const { data: statsData, error: statsError } = await supabase
          .from("emotion_game_sessions")
          .select("total_score, is_completed")
          .eq("patient_id", patientId)
          .eq("is_completed", true);

        if (!statsError && statsData) {
          setTotalGamesPlayed(statsData.length);
          const totalPoints = statsData.reduce(
            (sum, session) => sum + (session.total_score || 0),
            0
          );
          setTotalPointsEarned(totalPoints);
        }

        setGameState("ready");

        // Auto-start the game with user.id and questions count
        startGame(user.id, transformedQuestions.length);
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    }

    initializeGame();
  }, [supabase, router, patientId]);

  // Cleanup audio when component unmounts or question changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [currentQuestionIndex]); // Also cleanup when question changes

  async function startGame(userIdParam?: string, questionsCount?: number) {
    try {
      // Use parameters if provided, otherwise use state
      const gameUserId = userIdParam || userId;
      const gameQuestionsCount = questionsCount || questions.length;

      // Create a new game session
      const { data: session, error } = await supabase
        .from("emotion_game_sessions")
        .insert({
          patient_id: patientId,
          user_id: gameUserId,
          total_questions: gameQuestionsCount,
          questions_answered: 0,
          correct_answers: 0,
          total_score: 0,
          is_completed: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating session:", error);
        return;
      }
      console.log("session: ", session);
      setSessionId(session.id);
      setGameState("playing");
      setCurrentQuestionIndex(0);
      setScore(0);
      setCorrectAnswers(0);
    } catch (error) {
      console.error("Error starting game:", error);
    }
  }

  async function handleAnswerSelect(
    emotionId: string,
    isCorrectAnswer: boolean
  ) {
    if (selectedEmotionId) return; // Already answered

    setSelectedEmotionId(emotionId);
    setIsCorrect(isCorrectAnswer);

    const currentQuestion = questions[currentQuestionIndex];
    const coinsEarned = isCorrectAnswer ? 20 : 0;

    // Save answer to database
    try {
      await supabase.from("emotion_game_answers").insert({
        session_id: sessionId,
        question_id: currentQuestion.id,
        selected_emotion_id: emotionId,
        correct_emotion_id: currentQuestion.correct_emotion_id,
        is_correct: isCorrectAnswer,
        coins_earned: coinsEarned,
        attempt_number: 1,
      });

      // Update session stats
      const newScore = score + coinsEarned;
      const newCorrectAnswers = correctAnswers + (isCorrectAnswer ? 1 : 0);
      const newQuestionsAnswered = currentQuestionIndex + 1;

      await supabase
        .from("emotion_game_sessions")
        .update({
          questions_answered: newQuestionsAnswered,
          correct_answers: newCorrectAnswers,
          total_score: newScore,
        })
        .eq("id", sessionId);

      setScore(newScore);
      setCorrectAnswers(newCorrectAnswers);

      // Show confetti for correct answers
      if (isCorrectAnswer) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      // Set feedback state (synchronization point)
      setGameState("feedback");

      // Auto-advance to next question after 2 seconds
      setTimeout(() => {
        handleNextQuestion();
      }, 2000);
    } catch (error) {
      console.error("Error saving answer:", error);
    }
  }

  function handleNextQuestion() {
    // Clean up audio before moving to next question
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlayingQuestion(false); // Reset playing state

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      // Last question - complete the game
      completeGame();
      return;
    }
    console.log("im here to update !!!");
    // Update to next question
    setCurrentQuestionIndex(nextIndex);
    setSelectedEmotionId(null);
    setIsCorrect(null);
    setGameState("playing");
  }

  async function completeGame() {
    try {
      // Mark session as completed
      await supabase
        .from("emotion_game_sessions")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      // Update patient gamification points
      const { data: currentGamification } = await supabase
        .from("patient_gamification")
        .select("total_points")
        .eq("patient_id", patientId)
        .single();

      if (currentGamification) {
        await supabase
          .from("patient_gamification")
          .update({
            total_points: currentGamification.total_points + score,
          })
          .eq("patient_id", patientId);
      }

      setGameState("completed");
      setShowConfetti(true);
    } catch (error) {
      console.error("Error completing game:", error);
    }
  }

  function handlePlayAgain() {
    // Clean up audio on play again
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    setCurrentQuestionIndex(0);
    setSelectedEmotionId(null);
    setIsCorrect(null);
    setScore(0);
    setCorrectAnswers(0);
    setShowConfetti(false);
    setIsPlayingQuestion(false); // Reset playing state
    startGame();
  }

  // Loading state
  if (gameState === "loading" || isExiting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mb-4"></div>
          <p className="text-2xl text-red-600 font-bold">
            {isExiting ? "Exiting..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Game completed
  // Game completed - Show as modal overlay
  if (gameState === "completed") {
    const maxStars = 3;
    const starRating = Math.ceil(
      (correctAnswers / questions.length) * maxStars
    );
    const coinsEarned = score;

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-100 to-purple-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with progress */}
          <div className="mb-6 md:mb-8">
            {/* Mobile: Title and Coins Row */}
            <div className="flex md:hidden items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Feelings Match
              </h1>
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white flex-shrink-0">
                <span className="text-xl">🪙</span>
              </div>
            </div>

            {/* Mobile: Progress Bar Row */}
            <div className="flex md:hidden items-center gap-2">
              <div className="flex-1 h-2.5 bg-white/60 rounded-full overflow-hidden border-2 border-blue-300">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                  style={{
                    width: `100%`,
                  }}
                />
              </div>
              <span className="text-base font-bold text-gray-900 whitespace-nowrap">
                {questions.length}/{questions.length}
              </span>
            </div>

            {/* Tablet/Desktop: Original Layout */}
            <div className="hidden md:flex items-center justify-between">
              <h1 className="text-4xl font-bold text-gray-900">
                Feelings Match
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-64 h-3 bg-white/60 rounded-full overflow-hidden border-2 border-blue-300">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                      style={{
                        width: `100%`,
                      }}
                    />
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {questions.length}/{questions.length}
                  </span>
                </div>
                <div className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <span className="text-2xl">🪙</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Two Column Layout (blurred background) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 blur-sm opacity-60 pointer-events-none">
            {/* Left Column - Question Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 flex flex-col items-center justify-center min-h-[500px]">
              <p className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 leading-relaxed">
                {questions[questions.length - 1]?.scenario_text || ""}
              </p>
            </div>

            {/* Right Column - Answer Options */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                How does this person feel?
              </h2>
              <p className="text-gray-600 mb-6">Tap the correct emotion</p>
              <div className="grid grid-cols-2 gap-4">
                {questions[questions.length - 1]?.options.map((option) => (
                  <div
                    key={option.emotion_id}
                    className="border-2 border-gray-200 rounded-2xl p-4 h-32"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Overlay */}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

          <div className="w-full max-w-2xl">
            {/* Main completion card */}
            <div
              className="relative bg-[#fde9df] rounded-3xl sm:rounded-[40px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.15)] p-6 sm:p-8 overflow-hidden"
              style={{
                boxShadow: "0px 4px 0px 0px rgba(0,0,0,0.15)",
              }}
            >
              {/* Decorative gradient ellipse at bottom */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[769px] h-[363px] -mb-[263px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(0,0,0,0.08) 0%, transparent 70%)",
                }}
              />

              {/* Audio button */}
              <button
                className="absolute top-3 right-3 sm:top-5 sm:right-5 bg-[#f39f46] rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.15)] w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center hover:bg-[#e58f36] transition-colors disabled:opacity-50 z-20"
                disabled={isPlayingGreatJob}
                onClick={async () => {
                  if (isPlayingGreatJob) return;

                  try {
                    setIsPlayingGreatJob(true);

                    const response = await fetch("/api/tts", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        text: "Great Job!",
                      }),
                    });

                    if (!response.ok) {
                      throw new Error("Failed to generate speech");
                    }

                    const audioBlob = await response.blob();
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);

                    audio.onended = () => {
                      setIsPlayingGreatJob(false);
                      URL.revokeObjectURL(audioUrl);
                    };

                    audio.onerror = () => {
                      setIsPlayingGreatJob(false);
                      URL.revokeObjectURL(audioUrl);
                    };

                    await audio.play();
                  } catch (error) {
                    console.error("Error playing Great Job audio:", error);
                    setIsPlayingGreatJob(false);
                  }
                }}
              >
                <span className="text-xl sm:text-2xl">🔊</span>
              </button>

              <div className="relative z-10 flex flex-col items-center">
                {/* Mascot placeholder */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-[198px] md:h-[185px] mb-4 sm:mb-6 flex items-center justify-center">
                  <Image
                    src={
                      "https://gjipnyrufwqwdclriisk.supabase.co/storage/v1/object/public/emotion-emojis/celebrate.png"
                    }
                    alt={"celebrate"}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 198px"
                  />
                </div>

                {/* Title */}
                <h1
                  className="text-3xl sm:text-4xl md:text-[40px] font-bold text-black mb-4 sm:mb-6 text-center"
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    textShadow: "0px 2px 0px rgba(0,0,0,0.15)",
                    lineHeight: "normal",
                  }}
                >
                  Great Job!
                </h1>

                {/* Star rating */}
                <div className="flex gap-6 sm:gap-8 md:gap-12 mb-4 sm:mb-6">
                  {[...Array(maxStars)].map((_, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-[100px] md:h-[110px] relative"
                    >
                      <Image
                        src={index < starRating ? "/filled-star.svg" : "/empty-star.svg"}
                        alt={index < starRating ? "Filled star" : "Empty star"}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ))}
                </div>

                {/* Score and rewards section */}
                <div className="w-full max-w-[480px] flex flex-col gap-3 sm:gap-4 mb-8 sm:mb-12 md:mb-16">
                  {/* Score display */}
                  <div className="bg-white border border-[#9e9e9e] rounded-xl sm:rounded-[14px] px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-center">
                    <p
                      className="text-lg sm:text-xl md:text-[22px] font-bold text-black"
                      style={{
                        fontFamily: "Nunito, sans-serif",
                        textShadow: "0px 1.408px 0px rgba(0,0,0,0.15)",
                        letterSpacing: "-0.44px",
                      }}
                    >
                      Score{" "}
                      <span className="ml-2">
                        {correctAnswers}/{questions.length}
                      </span>
                    </p>
                  </div>

                  {/* Rewards cards */}
                  <div className="flex gap-3 sm:gap-4">
                    {/* Coins card */}
                    <div
                      className="flex-1 bg-[#fef8e1] rounded-lg sm:rounded-xl shadow-[0px_4px_0px_0px_rgba(0,0,0,0.15)] p-3 sm:p-4 flex items-center justify-center gap-2 backdrop-blur-sm"
                      style={{
                        boxShadow:
                          "0px 4px 0px 0px rgba(0,0,0,0.15), 0px 0px 8px 0px rgba(255,255,255,0.16) inset",
                      }}
                    >
                      <p
                        className="text-lg sm:text-xl md:text-[22px] font-bold text-black"
                        style={{
                          fontFamily: "Nunito, sans-serif",
                          textShadow: "0px 1.408px 0px rgba(0,0,0,0.15)",
                          letterSpacing: "-0.44px",
                        }}
                      >
                        +{coinsEarned} Coins
                      </p>
                      <span className="text-xl sm:text-2xl">🪙</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-[480px]">
                  {/* Back to Home button */}
                  <button
                    onClick={() => {
                      setIsExiting(true);
                      router.push(`/dashboard/patient/${patientId}/play`);
                    }}
                    className="flex-1 h-12 sm:h-[50px] relative rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] group overflow-hidden"
                  >
                    <div className="absolute inset-[-2px] bg-white rounded-full" />
                    <div
                      className="absolute inset-0 rounded-full border-[3px] border-white/20 overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(to bottom, #f39f46 0%, #e58936 100%)",
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
                      className="relative z-10 block text-white text-xl sm:text-2xl md:text-[24px] font-black uppercase"
                      style={{
                        fontFamily: "Nunito, sans-serif",
                        textShadow: "0px 2px 0px rgba(0,0,0,0.15)",
                        lineHeight: "28px",
                      }}
                    >
                      Back to Home
                    </span>
                  </button>

                  {/* Play Again button */}
                  <button
                    onClick={handlePlayAgain}
                    className="flex-1 h-12 sm:h-[50px] relative rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] group overflow-hidden"
                  >
                    <div className="absolute inset-[-2px] bg-white rounded-full" />
                    <div
                      className="absolute inset-0 rounded-full border-[3px] border-white/20 overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(to bottom, #68afff 0%, #5099e6 100%)",
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
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span className="text-white text-xl sm:text-2xl drop-shadow-[0px_2px_0px_rgba(0,0,0,0.15)]">
                        ▶
                      </span>
                      <span
                        className="text-white text-xl sm:text-2xl md:text-[24px] font-black uppercase"
                        style={{
                          fontFamily: "Nunito, sans-serif",
                          textShadow: "0px 2px 0px rgba(0,0,0,0.15)",
                          lineHeight: "28px",
                        }}
                      >
                        Play Again
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing or showing feedback
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-100 to-purple-100 p-4 md:p-8">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}

      <div className="max-w-7xl mx-auto">
        {/* Header with progress */}
        <div className="mb-6 md:mb-8">
          {/* Mobile: Title and Coins Row */}
          <div className="flex md:hidden items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Feelings Match</h1>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white flex-shrink-0">
                <span className="text-xl">🪙</span>
              </div>
              <Button
                onClick={() => {
                  setIsExiting(true);
                  router.push(`/dashboard/patient/${patientId}/play`);
                }}
                className="relative h-10 w-10 rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] bg-[#f39f46] hover:bg-[#d9883d] border-[3px] border-white/20 overflow-hidden p-0"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
                <Image
                  src="/exit.svg"
                  alt="Exit"
                  width={20}
                  height={20}
                  className="relative z-10"
                />
              </Button>
            </div>
          </div>

          {/* Mobile: Progress Bar Row */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex-1 h-2.5 bg-white/60 rounded-full overflow-hidden border-2 border-blue-300">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / questions.length) * 100
                  }%`,
                }}
              />
            </div>
            <span
              key={currentQuestionIndex}
              className="text-base font-bold text-gray-900 whitespace-nowrap"
            >
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>

          {/* Tablet/Desktop: Original Layout */}
          <div className="hidden md:flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">Feelings Match</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-64 h-3 bg-white/60 rounded-full overflow-hidden border-2 border-blue-300">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                    style={{
                      width: `${
                        ((currentQuestionIndex + 1) / questions.length) * 100
                      }%`,
                    }}
                  />
                </div>
                <span
                  key={currentQuestionIndex}
                  className="text-xl font-bold text-gray-900"
                >
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>
              <div className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-2xl">🪙</span>
              </div>
              <Button
                onClick={() => {
                  setIsExiting(true);
                  router.push(`/dashboard/patient/${patientId}/play`);
                }}
                className="relative h-12 w-12 rounded-full shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] bg-[#f39f46] hover:bg-[#d9883d] border-[3px] border-white/20 overflow-hidden p-0"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
                <Image
                  src="/exit.svg"
                  alt="Exit"
                  width={24}
                  height={24}
                  className="relative z-10"
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Question Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 flex flex-col items-center justify-center min-h-[500px]">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 leading-relaxed">
              {currentQuestion.scenario_text}
            </p>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 bg-amber-400 hover:bg-amber-500 border-none text-white text-lg px-6 py-6"
              onClick={async () => {
                if (isPlayingQuestion) return;

                try {
                  // Clean up any existing audio first
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                    audioRef.current = null;
                  }

                  setIsPlayingQuestion(true);

                  const response = await fetch("/api/tts", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      text: currentQuestion.scenario_text,
                      questionId: currentQuestion.id,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to generate speech");
                  }

                  const audioBlob = await response.blob();
                  const audioUrl = URL.createObjectURL(audioBlob);
                  const audio = new Audio(audioUrl);
                  audioRef.current = audio; // Store reference

                  audio.onended = () => {
                    setIsPlayingQuestion(false);
                    URL.revokeObjectURL(audioUrl);
                    audioRef.current = null;
                  };

                  audio.onerror = () => {
                    setIsPlayingQuestion(false);
                    URL.revokeObjectURL(audioUrl);
                    audioRef.current = null;
                  };

                  await audio.play();
                } catch (error) {
                  console.error("Error playing audio:", error);
                  setIsPlayingQuestion(false);
                }
              }}
              disabled={isPlayingQuestion}
            >
              <span className="text-xl">🔊</span>
              {isPlayingQuestion ? "A tocar..." : ""}
            </Button>
          </div>

          {/* Right Column - Answer Options */}
          <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              How does this person feel?
            </h2>
            <p className="text-gray-600 mb-6">Tap the correct emotion</p>

            <div className="grid grid-cols-2 gap-2 md:gap-4 items-stretch">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.emotion_id}
                  onClick={() => {
                    if (selectedEmotionId === null) {
                      handleAnswerSelect(option.emotion_id, option.is_correct);
                    }
                  }}
                  className={`h-full transform transition-transform ${
                    selectedEmotionId === null
                      ? "hover:scale-105 active:scale-95 cursor-pointer"
                      : "cursor-not-allowed"
                  }`}
                >
                  <EmojiCard
                    imageUrl={option.emotion.emoji_image_url || undefined}
                    emoji={option.emotion.emoji_unicode}
                    text={option.emotion.display_label}
                    emotionId={option.emotion_id}
                    isCorrect={
                      selectedEmotionId === option.emotion_id &&
                      isCorrect === true
                    }
                    isWrong={
                      selectedEmotionId === option.emotion_id &&
                      isCorrect === false
                    }
                    alwaysShowListen={true}
                    className={`${
                      selectedEmotionId
                        ? option.is_correct
                          ? "border-4 border-green-500"
                          : selectedEmotionId === option.emotion_id
                          ? "border-4 border-red-500"
                          : "opacity-50"
                        : "border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
