"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Lock, CheckCircle, Shield } from "lucide-react"
import AuthHeader from "@/components/AuthHeader"
import { updatePassword } from "@/app/actions/auth"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if we have a valid password reset session
    // This is set by Supabase when user clicks the email link
    const checkSession = async () => {
      try {
        // The hash fragment contains the access_token from the email link
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const type = hashParams.get("type")

        if (accessToken && type === "recovery") {
          // Valid session
        } else {
          // No valid session, redirect to forgot password
          router.push("/forgot-password")
        }
      } catch (error) {
        console.error("Error checking session:", error)
        router.push("/forgot-password")
      } finally {
        setIsChecking(false)
      }
    }

    checkSession()
  }, [router])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!password) {
      newErrors.password = "Password é obrigatória"
    } else if (password.length < 8) {
      newErrors.password = "Esta password é muito curta. Use pelo menos 8 caracteres."
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirme a password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "As passwords não coincidem"
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
      const result = await updatePassword(password)

      if (!result.success) {
        setApiError(result.error || "Erro ao atualizar password. Tente novamente.")
        setIsSubmitting(false)
        return
      }

      // Add a minimum delay to ensure loading state is visible
      await new Promise((resolve) => setTimeout(resolve, 800))

      setIsSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      console.error("Reset password error:", error)
      setApiError("Erro inesperado ao atualizar password. Tente novamente.")
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">A verificar...</p>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">
        <AuthHeader />

        <main className="relative flex-1 flex items-center justify-center">
          <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-4">
            <div className="bg-white/90 backdrop-blur rounded-3xl p-8 shadow-2xl border border-gray-100 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">Password Atualizada!</h1>
              <p className="text-lg text-gray-600 mb-6">
                A sua password foi atualizada com sucesso.
              </p>
              <p className="text-sm text-gray-500">A redirecioná-lo para o login...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">
      <AuthHeader />

      <main className="relative overflow-x-hidden flex-1 flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute bottom-0 right-0 w-1/3 h-2/3 opacity-10 hidden lg:block">
          <Image
            src="/gabi-helping-a-kid.jpg"
            alt="MindTherapy"
            fill
            className="object-contain object-bottom-right"
          />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-4">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              <span>Criar nova password</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Redefinir Password</h1>
            <p className="text-lg text-gray-600 mb-6">Escolha uma password segura para a sua conta</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/90 backdrop-blur rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Nova Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 transition-all ${
                        errors.password ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                      required
                      autoFocus
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

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirmar Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita a password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 transition-all ${
                        errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* API Error */}
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-600">{apiError}</p>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">A password deve ter:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Pelo menos 8 caracteres</li>
                    <li>• Uma combinação de letras e números (recomendado)</li>
                  </ul>
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
                      <span>A atualizar...</span>
                    </>
                  ) : (
                    <span>Atualizar Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
