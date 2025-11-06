"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, ArrowRight, Shield, CheckCircle, Heart } from "lucide-react"
import AuthHeader from "@/components/AuthHeader"

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">
      <AuthHeader />

      <main className="relative overflow-x-hidden flex-1 flex items-center justify-center">
        <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-4">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Confirme o seu Email</h1>
            <p className="text-lg text-gray-600 mb-3">Enviámos um email de confirmação para:</p>
            <p className="text-xl font-semibold text-purple-600 mb-6">{email}</p>

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

          {/* Info Card */}
          <div className="bg-white/90 backdrop-blur rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Próximos Passos:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Verifique a sua caixa de entrada (e spam/lixo)</li>
                  <li>Abra o email da MindTherapy</li>
                  <li>Clique no link de confirmação</li>
                  <li>Faça login e comece a usar a plataforma</li>
                </ol>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">Não recebeu o email?</p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Verifique a pasta de spam ou aguarde alguns minutos. Se o problema persistir, contacte o suporte.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold underline"
                >
                  <span>Voltar ao Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}
