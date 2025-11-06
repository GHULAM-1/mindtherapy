import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Criar Conta",
  description:
    "Crie a sua conta gratuita na MindTherapy e comece a usar ferramentas de comunicação aumentativa e alternativa (AAC) para apoio terapêutico personalizado.",
  keywords: [
    "criar conta",
    "registo",
    "MindTherapy",
    "plataforma terapêutica",
    "AAC",
    "comunicação aumentativa",
    "autismo",
    "terapia online",
  ],
  openGraph: {
    title: "Criar Conta | MindTherapy",
    description:
      "Junte-se à revolução do apoio terapêutico. Crie a sua conta gratuita e aceda a ferramentas inovadoras de comunicação e apoio.",
    type: "website",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Criar Conta | MindTherapy",
    description: "Crie a sua conta gratuita e comece a usar ferramentas de apoio terapêutico inovadoras.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
