import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Aceda ao seu dashboard MindTherapy para gerir as pessoas que acompanha, visualizar progressos e aceder a ferramentas terapêuticas.",
  keywords: [
    "dashboard",
    "painel",
    "gestão de pacientes",
    "progresso terapêutico",
    "MindTherapy",
    "AAC",
    "terapia",
  ],
  openGraph: {
    title: "Dashboard | MindTherapy",
    description: "Gerir pessoas, acompanhar progresso e aceder a ferramentas terapêuticas.",
    type: "website",
    locale: "pt_PT",
  },
  robots: {
    index: false, // Dashboard shouldn't be indexed by search engines
    follow: false,
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
