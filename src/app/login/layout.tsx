import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
  description:
    "Faça login na sua conta MindTherapy e aceda às suas ferramentas de comunicação aumentativa e alternativa (AAC) para apoio terapêutico.",
  keywords: [
    "login",
    "entrar",
    "MindTherapy",
    "plataforma terapêutica",
    "AAC",
    "comunicação aumentativa",
    "autismo",
    "terapia online",
  ],
  openGraph: {
    title: "Login | MindTherapy",
    description: "Aceda à sua conta MindTherapy e continue o seu progresso terapêutico.",
    type: "website",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | MindTherapy",
    description: "Aceda à sua conta MindTherapy e continue o seu progresso terapêutico.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
