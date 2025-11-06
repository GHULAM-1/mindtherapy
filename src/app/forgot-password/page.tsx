"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Shield, Heart, CheckCircle, Mail, KeyRound, Send } from "lucide-react"
import AuthHeader from "@/components/AuthHeader"
import { resetPassword } from "@/app/actions/auth"

interface RecoverData {
  email: string
}

export default function RecuperarPasswordPage() {
  const [formData, setFormData] = useState<RecoverData>({
    email: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string>("")

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "Email é obrigatório"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
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
      const result = await resetPassword(formData.email)

      if (!result.success) {
        console.error("Reset password failed:", result.error)
        setApiError(result.error || "Erro ao enviar email de recuperação. Tente novamente.")
        setIsSubmitting(false)
        return
      }

      setIsSubmitted(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error("Recover password error:", error)
      setApiError("Erro inesperado ao enviar email de recuperação. Tente novamente.")
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setIsSubmitting(true)
    setApiError("")

    try {
      const result = await resetPassword(formData.email)

      if (!result.success) {
        setApiError(result.error || "Erro ao reenviar email.")
        return
      }

      alert("Email reenviado com sucesso!")
    } catch {
      setApiError("Erro ao reenviar email.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">
      <AuthHeader />

      {/* Main Content */}
      <main className="relative overflow-x-hidden flex-1 flex items-center justify-center">
        {/* Background Image - Subtle and positioned */}
        <div className="absolute bottom-0 right-0 w-1/3 h-2/3 opacity-10 hidden lg:block">
          <Image
            src="/gabi-helping-a-kid.jpg"
            alt="MindTherapy"
            fill
            className="object-contain object-bottom-right"
          />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-4">
          {!isSubmitted ? (
            <>
              {/* Header Section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <KeyRound className="w-4 h-4" />
                  <span>Recuperação de password</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Esqueceu a Password?</h1>
                <p className="text-lg text-gray-600 mb-6">
                  Não se preocupe! Introduza o seu email e enviaremos instruções para criar uma nova password.
                </p>

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
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email da Conta
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
                      <p className="mt-2 text-sm text-gray-500">Introduza o email associado à sua conta MindTherapy</p>
                    </div>

                    {/* API Error Display */}
                    {apiError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-600">{apiError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                        isSubmitting
                          ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                          : "text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span>A enviar...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Enviar Instruções</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Back to Login Link */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-gray-600">
                    Lembrou-se da password?{" "}
                    <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold underline">
                      Fazer Login
                    </Link>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Email Enviado!</h1>
                <p className="text-lg text-gray-600 mb-3">Enviámos instruções para recuperar a sua password para:</p>
                <p className="text-xl font-semibold text-purple-600 mb-6">{formData.email}</p>

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

              {/* Success Card */}
              <div className="bg-white/90 backdrop-blur rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100">
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Próximos Passos:</h3>
                    <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                      <li>Verifique a sua caixa de entrada</li>
                      <li>Clique no link no email (válido por 24 horas)</li>
                      <li>Crie uma nova password segura</li>
                      <li>Faça login com a nova password</li>
                    </ol>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">Não recebeu o email?</p>
                    <button
                      onClick={handleResend}
                      disabled={isSubmitting}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isSubmitting
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                          <span>A reenviar...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>Reenviar Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-6 border-t border-gray-200 text-center">
                    <p className="text-gray-600">
                      <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold underline">
                        Voltar ao Login
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
