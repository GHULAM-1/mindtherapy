"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, Heart, Sparkles, Mail, Lock, CheckCircle } from "lucide-react"
import AuthHeader from "@/components/AuthHeader"
import { signUp } from "@/app/actions/auth"

interface SignupData {
  email: string
  password: string
  acceptTerms: boolean
  acceptNewsletter: boolean
}

export default function RegistoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignupData>({
    email: "",
    password: "",
    acceptTerms: false,
    acceptNewsletter: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string>("")

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "Email é obrigatório"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "Password é obrigatória"
    } else if (formData.password.length < 8) {
      newErrors.password = "Esta password é muito curta. Use pelo menos 8 caracteres."
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Deve aceitar os termos e condições"
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
      // Create account with just email and password
      // User will complete profile in onboarding
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        name: "", // Empty for now, will be filled in onboarding
        situation: "", // Will be filled in onboarding
        acceptNewsletter: formData.acceptNewsletter,
      })

      if (!result.success) {
        setApiError(result.error || "Erro ao criar conta. Tente novamente.")
        setIsSubmitting(false)
        return
      }

      // Add a minimum delay to ensure loading state is visible
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Check if email confirmation is required
      const data = result.data as { requiresEmailConfirmation?: boolean; email?: string } | undefined
      if (data?.requiresEmailConfirmation) {
        router.push(`/auth/confirm-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        // Redirect to onboarding to complete profile
        router.push("/onboarding")
      }
    } catch (error) {
      console.error("Signup error:", error)
      setApiError("Erro inesperado ao criar conta. Tente novamente.")
      setIsSubmitting(false)
    }
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

        <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-4">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Junte-se à revolução do apoio terapêutico</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Criar Conta</h1>
            <p className="text-lg text-gray-600 mb-6">Rápido e sem complicações</p>

            {/* Trust Indicators */}
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Dados protegidos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-600" />
                <span>Apoio 24/7</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/90 backdrop-blur rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 transition-all ${
                      errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-3 pr-12 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 transition-all ${
                        errors.password ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                {/* API Error */}
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-600">{apiError}</p>
                  </div>
                )}

                {/* Terms & Newsletter */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      id="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                      required
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      Aceito os{" "}
                      <span className="text-purple-600 hover:text-purple-700 underline">
                        Termos e Condições
                      </span>{" "}
                      e a{" "}
                      <span className="text-purple-600 hover:text-purple-700 underline">
                        Política de Privacidade
                      </span>
                    </label>
                  </div>
                  {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms}</p>}

                  <div className="flex items-start gap-3">
                    <input
                      id="acceptNewsletter"
                      type="checkbox"
                      checked={formData.acceptNewsletter}
                      onChange={(e) => setFormData({ ...formData, acceptNewsletter: e.target.checked })}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="acceptNewsletter" className="text-sm text-gray-700">
                      Quero receber novidades e dicas sobre apoio terapêutico (opcional)
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                      : "text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span>A criar conta...</span>
                    </>
                  ) : (
                    <span>Criar Conta</span>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500">
                  Após criar a conta, vamos pedir mais alguns dados para personalizar a sua experiência
                </p>
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                Já tem conta?{" "}
                <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold underline">
                  Fazer Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
