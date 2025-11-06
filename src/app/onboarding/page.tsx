"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { User, Sparkles, ArrowRight } from "lucide-react"
import { completeProfile } from "@/app/actions/auth"
import { getProfile } from "@/lib/supabase/profiles-client"
import { SITUATION_OPTIONS, type UserSituation } from "@/types/database.types"
import CustomSelect from "@/components/CustomSelect"
import AuthHeader from "@/components/AuthHeader"

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [situation, setSituation] = useState<UserSituation | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState("")

  // Check if profile is already completed
  useEffect(() => {
    async function checkProfile() {
      try {
        const profile = await getProfile()

        if (!profile) {
          // No profile found, redirect to login
          router.push("/login")
          return
        }

        if (profile.profile_completed) {
          // Profile already completed, redirect to dashboard
          router.push("/dashboard")
          return
        }

        // Pre-fill if there's any existing data
        if (profile.full_name) setName(profile.full_name)
        if (profile.situation) setSituation(profile.situation)
      } catch (error) {
        console.error("Error checking profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkProfile()
  }, [router])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }

    if (!situation) {
      newErrors.situation = "Situação é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setApiError("")

    try {
      const result = await completeProfile({
        full_name: name.trim(),
        situation: situation as UserSituation,
      })

      if (!result.success) {
        setApiError(result.error || "Erro ao completar perfil. Tente novamente.")
        setIsSubmitting(false)
        return
      }

      // Add a minimum delay to ensure loading state is visible
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Success! Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Onboarding error:", error)
      setApiError("Erro inesperado. Tente novamente.")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">A carregar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col overflow-hidden">
      <AuthHeader />

      {/* Main Content */}
      <main className="relative overflow-x-hidden flex-1 flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute bottom-0 right-0 w-1/3 h-2/3 opacity-10 hidden lg:block">
          <Image src="/gabi-helping-a-kid.jpg" alt="MindTherapy" fill className="object-contain object-bottom-right" />
        </div>

        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-4">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Quase lá!</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Complete o Seu Perfil</h1>
            <p className="text-lg text-gray-600 mb-6">
              Precisamos de mais algumas informações para personalizar a sua experiência
            </p>

            {/* Progress Indicator */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-600">Passo 2 de 2</span>
                <span className="text-sm text-gray-500">Quase completo!</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/90 backdrop-blur rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="O seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 transition-all ${
                      errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    required
                    autoFocus
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Situation */}
                <CustomSelect
                  label="Qual é a sua situação?"
                  value={situation}
                  onChange={(value) => setSituation(value as UserSituation)}
                  placeholder="Selecione a sua situação"
                  error={errors.situation}
                  required
                  options={SITUATION_OPTIONS}
                />

                {/* API Error */}
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-600">{apiError}</p>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Por que pedimos isto?</strong>
                    <br />
                    Estas informações ajudam-nos a personalizar a sua experiência e fornecer conteúdo relevante para a
                    sua situação específica.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                      : "text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span>A guardar...</span>
                    </>
                  ) : (
                    <>
                      <span>Começar a Usar o MindTherapy</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Note */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Os seus dados estão protegidos e nunca serão partilhados sem o seu consentimento.
          </p>
        </div>
      </main>
    </div>
  )
}
