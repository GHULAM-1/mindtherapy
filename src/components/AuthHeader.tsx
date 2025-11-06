import Image from "next/image"
import Link from "next/link"

export default function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100 shrink-0">
      <div className="max-w-6xl mx-auto px-2">
        <div className="h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/logos/mindtherapy.svg"
                alt="MindTherapy"
                width={80}
                height={64}
                className="h-16 w-auto md:h-20 object-contain shrink-0"
                priority
              />
              <span className="text-base md:text-lg font-semibold text-gray-900 truncate">
                MindTherapy
              </span>
            </Link>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg text-gray-600 hover:text-purple-600 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Voltar ao Início</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
