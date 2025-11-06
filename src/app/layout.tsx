import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MindTherapy - Apoio Terapêutico para Autismo",
    template: "%s | MindTherapy",
  },
  description: "Plataforma especializada em autismo e dificuldades de comunicação. Ferramentas terapêuticas inovadoras, suporte familiar 24/7 e metodologias comprovadas.",
  keywords: [
    "autismo",
    "autism",
    "apoio autismo",
    "terapia autismo",
    "comunicação autismo",
    "suporte familiar autismo",
    "ferramentas autismo",
    "app autismo",
    "dificuldades comunicação",
    "necessidades especiais",
    "desenvolvimento autismo",
    "comportamento autismo",
    "rotinas autismo",
    "competências sociais",
    "terapia da fala",
    "intervenção precoce",
    "educação especial",
    "tecnologia assistiva",
    "comunicação aumentativa",
    "CAA",
    "símbolos comunicação",
    "jogos terapêuticos",
    "desenvolvimento cognitivo",
    "autonomia autismo",
    "espectro autismo",
    "perturbação comunicação",
    "linguagem autismo"
  ],
  authors: [{ name: "MindTherapy" }],
  creator: "MindTherapy",
  publisher: "MindTherapy",
  generator: 'v0.app',
  alternates: {
    canonical: "https://mindtherapy.pt",
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "https://mindtherapy.pt",
    siteName: "MindTherapy",
    title: "MindTherapy - Apoio Terapêutico para Autismo",
    description: "Plataforma especializada em autismo e dificuldades de comunicação. Ferramentas terapêuticas inovadoras, suporte familiar 24/7 e metodologias comprovadas.",
    images: [
      {
        url: "/og-image.png", // You'll need to create this
        width: 1200,
        height: 630,
        alt: "MindTherapy - Apoio Terapêutico para Autismo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MindTherapy - Apoio Terapêutico para Autismo",
    description: "Plataforma especializada em autismo e dificuldades de comunicação.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes when ready
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics/>
      </body>
    </html>
  );
}
