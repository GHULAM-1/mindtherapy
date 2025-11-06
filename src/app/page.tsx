"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Heart,
  Sparkles,
  Users,
  Shield,
  Award,
  Clock,
  ArrowRight,
  Star,
  CheckCircle,
  Brain,
  MessageCircle,
  Target,
  TrendingUp,
  Mail,
  Zap,
  Gift,
  X,
  Play,
  Eye,
  MessageSquare,
  Pill,
  Headphones,
  Handshake,
  MapPin,
  Quote,
} from "lucide-react"

// Instagram icon component (replacing deprecated lucide-react Instagram)
const Instagram = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)


const notifications = [
  "João de Lisboa acabou de se inscrever",
  "Maria do Porto juntou-se há 2 minutos",
  "Carlos de Braga garantiu o seu lugar",
  "Ana de Coimbra acabou de se registar",
  "Pedro de Faro juntou-se à lista",
]

export default function LandingPage() {
  const [showNotification, setShowNotification] = useState(false)
  const [currentNotification, setCurrentNotification] = useState("")
  const [showPrototypeModal, setShowPrototypeModal] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState("")
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideo, setCurrentVideo] = useState("")
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("hasShownNotification") === "true";
    setHasShownNotification(seen);
  }, []);

  const [showFloatingCTA, setShowFloatingCTA] = useState(false)

  useEffect(() => {
    // Helper to show one notification
    const showOneNotification = (message: string) => {
      if (hasShownNotification) return;

      setCurrentNotification(message);
      setShowNotification(true);
      setHasShownNotification(true);
      localStorage.setItem("hasShownNotification", "true");

      setTimeout(() => setShowNotification(false), 7000);
    };

    const signupTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        // Timer for signup tracking
      }
    }, 30000)

    const notificationTimer = setInterval(() => {
      if (hasShownNotification) return;

      if (Math.random() > 0.6) {
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        showOneNotification(randomNotification);
      }
    }, 20000);

    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 800)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      clearInterval(signupTimer)
      clearInterval(notificationTimer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [hasShownNotification])

  const scrollToForm = () => {
    const formElement = document.getElementById("waitlist-form")
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  const openPrototypeModal = (prototype: string) => {
    setSelectedPrototype(prototype)
    setShowPrototypeModal(true)
  }

  const handleStartDemo = (videoType: string) => {
    setShowPrototypeModal(false)
    setCurrentVideo(videoType)
    setShowVideoModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-14 md:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
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
            </div>

            <button
              onClick={scrollToForm}
              aria-label="Juntar-se à Lista de Espera"
              className="
                cursor-pointer inline-flex items-center gap-2 rounded-lg
                bg-purple-600 text-white
                px-3 py-1.5 text-sm font-semibold
                hover:bg-purple-700 transition-colors
                sm:px-4 sm:py-2 sm:text-base
              "
            >
              <span className="sm:hidden">Lista de Espera</span>
              <span className="hidden sm:inline">Juntar-se à Lista de Espera</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

          </div>
        </div>
      </header>

      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <video
              controls
              autoPlay
              className="w-full h-auto max-h-[80vh]"
              onError={(e) => {
                console.error("[v0] Video failed to load:", e)
                alert("Erro ao carregar o vídeo. Verifique se o arquivo existe no diretório public/videos/")
              }}
            >
              <source src={`/videos/${currentVideo}.mp4`} type="video/mp4" />
              <source src={`/videos/${currentVideo}.webm`} type="video/webm" />O seu navegador não suporta a reprodução
              de vídeo.
            </video>
          </div>
        </div>
      )}

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-20 right-6 z-50 bg-white rounded-lg shadow-2xl border border-green-200 p-4 max-w-sm animate-slide-in">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{currentNotification}</p>
              <p className="text-xs text-gray-500">Há poucos minutos</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showPrototypeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Preview: {selectedPrototype}</h3>
              <button onClick={() => setShowPrototypeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-8 text-center mb-6">
                <Play className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <button
                  onClick={() => {
                    let videoType = "demo"
                    if (selectedPrototype === "Dashboard de Pais e Terapeutas") {
                      videoType = "dashboard-demo"
                    } else if (selectedPrototype === "Comunicador AAC Inteligente") {
                      videoType = "aac-demo"
                    } else if (selectedPrototype === "Jogos de Memória Adaptativos") {
                      videoType = "memory-games-demo"
                    }
                    handleStartDemo(videoType)
                  }}
                  className="cursor-pointer bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Iniciar Demo
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Funcionalidades Principais:</h5>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Interface adaptativa</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Personalização automática</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Relatórios de progresso</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Benefícios Comprovados:</h5>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Melhoria de 85% na comunicação</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Redução de 70% no stress familiar</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Aumento de 90% na autonomia</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Banner */}
      <div
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 text-center relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-white" />
            <span className="font-bold text-sm text-white">JUNTE-SE À NOSSA COMUNIDADE</span>
          </div>
          <div className="hidden lg:flex items-center space-x-2 text-sm">
            <Heart className="w-4 h-4 text-white" />
            <span className="text-white">250+ famílias já se inscreveram</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 pt-4 pb-4">
        {/* softly-tinted background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-white to-blue-50" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: Copy + CTAs */}
          <div>
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-5">
              <Gift className="w-4 h-4" />
              <span>80% desconto vitalício para todos na lista de espera</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Autismo e Comunicação
              <span className="block text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Dar palavras ao silêncio
              </span>
            </h1>

            <p className="text-sm md:text-base text-gray-600 mb-7 max-w-xl">
              A primeira plataforma de apoio terapêutico especializada que combina AI avançada com
              metodologias comprovadas para pessoas autistas e dificuldades de comunicação.
            </p>

            {/* Primary CTA + social proof */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:space-x-4 space-y-3 sm:space-y-2 mb-8">
              <button
                onClick={scrollToForm}
                className="cursor-pointer bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-base hover:shadow-lg hover:bg-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                aria-label="Juntar-se à Lista de Espera"
              >
                <span>Juntar-se à Lista de Espera</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center text-gray-600">
                <Users className="w-5 h-5 mr-2" />
                <span className="font-medium">250+ famílias já se inscreveram</span>
              </div>
            </div>
          </div>

          {/* Right: Featured image */}
          <div className="relative hidden md:block">
            <Image
              src="/mindtherapy-animation-with-kid.png"
              alt="Criança a comunicar com apoio visual — foco na inclusão e CAA"
              width={990}
              height={557}
              priority
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Criado especialmente para famílias que enfrentam desafios únicos
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Pessoas Autistas</h3>
              <p className="text-gray-600">
                Ferramentas especializadas para comunicação, rotinas e desenvolvimento de competências sociais.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Dificuldades de Comunicação</h3>
              <p className="text-gray-600">Suporte para desenvolvimento da linguagem e comunicação alternativa.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Apoio Educativo</h3>
              <p className="text-gray-600">Jogos educativos adaptados à idade e às necessidades da criança, promovendo a aprendizagem de forma lúdica e eficaz.</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={scrollToForm}
              className="cursor-pointer bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Descobrir Como Podemos Ajudar
            </button>
          </div>
        </div>
      </section>

      {/* Emotional Stories */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Da Frustração à Esperança</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Histórias reais de famílias que transformaram os seus desafios em conquistas extraordinárias
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Sofia's Story */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  S
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">Sofia, 8 anos</h3>
                  <p className="text-gray-600">Autismo com dificuldades de comunicação</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-red-800 mb-2">ANTES: Isolamento e Frustração</h4>
                  <p className="text-red-700 text-sm">
                    &quot;A Sofia tinha crises de frustração por não conseguir expressar as suas necessidades. Sentia-me
                    perdida, sem saber como ajudá-la. As idas ao supermercado eram um pesadelo.&quot;
                  </p>
                  <p className="text-red-600 text-xs mt-2 italic">- Mãe da Sofia</p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-800 mb-2">DEPOIS: Comunicação e Alegria</h4>
                  <p className="text-green-700 text-sm">
                    &quot;Em 5 meses, a Sofia começou a usar o sistema de comunicação por imagens. Agora ela pede o que
                    quer, expressa os seus sentimentos. Voltou a sorrir!&quot;
                  </p>
                  <p className="text-green-600 text-xs mt-2 italic">- Mãe da Sofia, após MindTherapy</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-purple-600 font-semibold">Progresso em 5 meses</span>
                <div className="flex space-x-4">
                  <span className="text-gray-600">Crises: -80%</span>
                  <span className="text-gray-600">Comunicação: +200%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  M
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">Miguel, 15 anos</h3>
                  <p className="text-gray-600">Autismo com dificuldades sociais</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-red-800 mb-2">ANTES: Ansiedade Social</h4>
                  <p className="text-red-700 text-sm">
                    &quot;O Miguel evitava interações na escola. Sentia-se ansioso em grupo e tinha dificuldade em manter
                    conversas simples. Estava sempre isolado, o que o deixava triste.&quot;
                  </p>
                  <p className="text-red-600 text-xs mt-2 italic">- Mãe do Miguel</p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-800 mb-2">DEPOIS: Primeiros Passos na Integração</h4>
                  <p className="text-green-700 text-sm">
                    &quot;Com os jogos de simulação social da MindTherapy, o Miguel começou a treinar diálogos e expressões.
                    Hoje já consegue iniciar pequenas conversas e participa em alguns grupos na escola. Ainda enfrenta
                    desafios, mas está mais confiante e dá passos importantes todos os dias.&quot;
                  </p>
                  <p className="text-green-600 text-xs mt-2 italic">- Mãe do Miguel, após MindTherapy</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-blue-600 font-semibold">Progresso em 4 meses</span>
                <div className="flex space-x-4">
                  <span className="text-gray-600">Ansiedade: -70%</span>
                  <span className="text-gray-600">Interação social: +120%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-1">89%</div>
              <div className="text-sm text-gray-600">Redução no stress familiar</div>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">94%</div>
              <div className="text-sm text-gray-600">Melhoria na comunicação</div>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">76%</div>
              <div className="text-sm text-gray-600">Aumento da independência</div>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">92%</div>
              <div className="text-sm text-gray-600">Satisfação das famílias</div>
            </div>
          </div>


          <div className="text-center mt-12">
            <button
              onClick={scrollToForm}
              className="cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-lg border-0"
            >
              Começar a Nossa Jornada de Transformação
            </button>
          </div>
        </div>
      </section>

      {/* Prototypes Section with Enhanced Visuals */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Veja o Futuro em Ação</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Protótipos funcionais que já estão a transformar vidas. Seja um dos primeiros a experimentar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Users className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Dashboard de Pais e Terapeutas</h3>
                <p className="text-gray-600 mb-4">
                  Plataforma centralizada onde pais e terapeutas podem acompanhar utentes, visualizar informações
                  detalhadas e monitorizar progressos em tempo real.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-700 italic">
                    &quot;Finalmente consigo ver o progresso da minha filha de forma clara!&quot; - Mãe do Porto
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-green-600 font-semibold">✅ Funcional</span>
                  <span className="text-gray-500">Disponível agora</span>
                </div>
                <button
                  onClick={() => openPrototypeModal("Dashboard de Pais e Terapeutas")}
                  className="cursor-pointer w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Preview</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <MessageSquare className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Comunicador CAA Inteligente</h3>
                <p className="text-gray-600 mb-4">
                  Ferramenta de comunicação aumentativa que aprende com cada interação, facilitando a expressão de
                  crianças com dificuldades de comunicação.
                </p>
                <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-green-700 italic">
                    &quot;O meu filho conseguiu comunicar pela primeira vez!&quot; - Pai de Coimbra
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-green-600 font-semibold">✅ Funcional</span>
                  <span className="text-gray-500">Disponível agora</span>
                </div>
                <button
                  onClick={() => openPrototypeModal("Comunicador AAC Inteligente")}
                  className="cursor-pointer w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Preview</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Brain className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Jogos de Memória Adaptativos</h3>
                <p className="text-gray-600 mb-4">
                  Jogos que se ajustam automaticamente ao nível cognitivo da criança, promovendo o desenvolvimento da
                  memória de forma divertida.
                </p>
                <div className="bg-purple-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-purple-700 italic">
                    &quot;A minha filha adora e está a melhorar muito!&quot; - Mãe de Braga
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-green-600 font-semibold">✅ Funcional</span>
                  <span className="text-gray-500">Disponível agora</span>
                </div>
                <button
                  onClick={() => openPrototypeModal("Jogos de Memória Adaptativos")}
                  className="cursor-pointer w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Preview</span>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-orange-100">
              <div className="h-48 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                <Headphones className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Meditação Guiada (Sensorial)</h3>
                <p className="text-gray-600 mb-4">
                  Sessões curtas e adaptativas (voz + visuais) para respiração, regulação emocional e rotinas
                  de acalmar - pensadas para perfis sensoriais autistas.
                </p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-yellow-600 font-semibold">🛠️ Em desenvolvimento</span>
                  <span className="text-gray-500">Em breve</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-rose-100">
              <div className="h-48 bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
                <Pill className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Gestão de Medicação</h3>
                <p className="text-gray-600 mb-4">
                  Agenda de toma com lembretes, confirmação por cuidador, registo de sintomas e relatórios
                  para partilha com profissionais de saúde.
                </p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-yellow-600 font-semibold">🛠️ Em desenvolvimento</span>
                  <span className="text-gray-500">Em breve</span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  *A MindTherapy não substitui aconselhamento médico. Consulte sempre profissionais de saúde.*
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={scrollToForm}
              className="cursor-pointer bg-indigo-700 bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 hover:from-indigo-800 hover:to-purple-800"
              style={{ backgroundColor: "#4338ca", color: "#ffffff" }}
            >
              Quero Acesso Exclusivo aos Protótipos
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tecnologia Avançada ao Serviço da Humanidade</h2>
            <p className="text-xl text-gray-600">
              Cada funcionalidade foi pensada com amor e validada por especialistas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Especializada</h3>
              <p className="text-gray-600">
                Algoritmos treinados especificamente para neurodivergência, com validação clínica.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personalização Total</h3>
              <p className="text-gray-600">Cada experiência adapta-se às necessidades únicas de cada pessoa.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Progresso Mensurável</h3>
              <p className="text-gray-600">Relatórios detalhados que mostram a evolução e conquistas alcançadas.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacidade Absoluta</h3>
              <p className="text-gray-600">Dados encriptados e protegidos com os mais altos padrões de segurança.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Suporte Humano</h3>
              <p className="text-gray-600">Equipa de especialistas disponível para apoio personalizado.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Evolução Contínua</h3>
              <p className="text-gray-600">Novas funcionalidades baseadas no feedback da comunidade.</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={scrollToForm}
              className="cursor-pointer bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Zap className="w-5 h-5" />
              <span>Experimentar Estas Funcionalidades</span>
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Apoiado pelo{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                <a href="https://www.pact.pt/" target="_blank" rel="noopener noreferrer">PACT</a>
              </span>{" "}
              e pelo Programa XBoost
            </h2>

            <p className="text-lg text-gray-600 mb-6">
              A MindTherapy integra o{" "}
              <strong>Parque do Alentejo de Ciência e Tecnologia (PACT)</strong> e beneficia do
              programa de aceleração <strong>XBoost</strong>, <em>no âmbito do projeto eGames Lab</em>,
              garantindo-nos validação institucional, rede de mentores e suporte estratégico.
            </p>

            {/* Logos Row (PACT + XBoost + eGames Lab) */}
            <div className="flex items-center gap-6 mb-6">
              <a href="https://www.pact.pt/" target="_blank">
                <Image
                  src="/logos/pact.png"
                  alt="PACT - Parque do Alentejo de Ciência e Tecnologia"
                  width={100}
                  height={48}
                  className="h-12 w-auto object-contain rounded-md shadow-sm border border-gray-200 bg-white"
                />
              </a>
              <a href="https://pact.pt/pt-pt/news/pact-presents-xboost-a-support-program-for-gaming-entrepreneurs-at-an-exclusive-event" target="_blank">
                <Image
                  src="/logos/xboost.png"
                  alt="XBoost Program"
                  width={100}
                  height={48}
                  className="h-12 w-auto object-contain rounded-md shadow-sm border border-gray-200 bg-white"
                />
              </a>
              <a href="https://egameslab.pt" target="_blank">
                <Image
                  src="/logos/egames-lab.png"
                  alt="eGames Lab"
                  width={100}
                  height={48}
                  className="h-12 w-auto object-contain rounded-md shadow-sm border border-gray-200 bg-white"
                />
              </a>
            </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/pact-v2.jpg"
                alt="Edifício do Parque do Alentejo de Ciência e Tecnologia (PACT)"
                width={600}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Certifications */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-center text-gray-900 mb-8">Certificações e Conformidade</h3>
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-green-800">GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-blue-800">ISO 27001</span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
                <span className="font-semibold text-purple-800">CE Medical</span>
              </div>
            </div>
          </div>
                {/* Partners Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white via-purple-50/30 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full mb-6">
              <Handshake className="w-5 h-5 text-purple-600" />
              <span className="text-purple-700 font-semibold text-sm">Nossos Parceiros</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              As Pessoas que Tornam Este Sonho Possível
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Profissionais excepcionais que acreditam na nossa missão e contribuem com a sua experiência,
              conhecimento e paixão para transformar vidas
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
            {/* Salomé Ratinho */}
            <div className="group relative">
              {/* Card background with gradient border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>

              <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
                {/* Header section with image and basic info */}
                <div className="flex flex-col items-center text-center mb-6">
                  {/* Image with decorative ring */}
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-md opacity-40"></div>
                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                      <Image
                        src="/partners/salome-ratinho.jpg"
                        alt="Dra. Salomé Ratinho - Médica Especialista de Psiquiatria da Infância e Adolescência"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Flag badge */}
                    <div className="absolute bottom-0 right-0">
                      <Image
                        src="/flags/portugal.svg"
                        alt="Portugal"
                        width={40}
                        height={28}
                        className="w-10 h-auto rounded-md"
                      />
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    Dra. Salomé Ratinho
                  </h3>

                  {/* Specialty badge */}
                  <div className="mb-3 min-h-[44px] flex items-center justify-center">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
                      <p className="text-purple-700 font-semibold text-sm">
                        Psiquiatria da Infância e Adolescência
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 mb-6">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Évora, Portugal</span>
                  </div>
                </div>

                {/* Quote/Highlight */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-6 relative">
                  <Quote className="absolute top-3 left-3 w-8 h-8 text-purple-300" />
                  <p className="text-purple-900 font-medium italic pl-8 text-sm leading-relaxed">
                    &ldquo;Diretora clínica da Escutamente, formadora e oradora em congressos sobre saúde mental infantil&rdquo;
                  </p>
                </div>

                {/* Key achievements */}
                <div className="space-y-3 mb-6 flex-grow">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Ex-coordenadora da Unidade de Psiquiatria da Infância e Adolescência do Hospital Espírito Santo de Évora (2019-2023)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Co-autora das Orientações para o desenvolvimento de Equipas comunitárias de saúde mental do Alentejo
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Autora de publicações científicas na área da saúde mental infantil
                    </p>
                  </div>
                </div>

                {/* Instagram button */}
                <div className="mt-auto pt-6 border-t border-purple-100">
                  <a
                    href="https://www.instagram.com/doutora_ratinho_pedopsiquiatra/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Instagram className="w-5 h-5" />
                    <span>Seguir no Instagram</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Caio Macharett */}
            <div className="group relative">
              {/* Card background with gradient border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>

              <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
                {/* Header section with image and basic info */}
                <div className="flex flex-col items-center text-center mb-6">
                  {/* Image with decorative ring */}
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-teal-400 rounded-full blur-md opacity-40"></div>
                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                      <Image
                        src="/partners/caio-macharett.jpg"
                        alt="Caio Macharett - Técnico de Enfermagem e Orador Motivacional"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover object-[center_20%]"
                      />
                    </div>
                    {/* Flag badge */}
                    <div className="absolute bottom-0 right-0">
                      <Image
                        src="/flags/brazil.svg"
                        alt="Brasil"
                        width={40}
                        height={28}
                        className="w-10 h-auto rounded-md"
                      />
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    Caio Macharett
                  </h3>

                  {/* Specialty badges */}
                  <div className="flex flex-wrap gap-2 justify-center mb-3 min-h-[44px] items-center">
                    <div className="bg-gradient-to-r from-green-100 to-teal-100 px-3 py-1.5 rounded-full">
                      <p className="text-green-700 font-semibold text-xs">
                        Técnico de Enfermagem
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-green-100 to-teal-100 px-3 py-1.5 rounded-full">
                      <p className="text-green-700 font-semibold text-xs">
                        Orador Motivacional
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 mb-6">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Rio de Janeiro, Brasil</span>
                  </div>
                </div>

                {/* Quote/Highlight */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-5 mb-6 relative">
                  <Quote className="absolute top-3 left-3 w-8 h-8 text-green-300" />
                  <p className="text-green-900 font-medium italic pl-8 text-sm leading-relaxed">
                    &ldquo;Pai atípico que partilha a sua jornada para inspirar famílias e profissionais ao redor do mundo&rdquo;
                  </p>
                </div>

                {/* Key points */}
                <div className="space-y-3 mb-6 flex-grow">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Pai de criança com hidrocefalia bilateral, autismo de suporte 2 e deficiência intelectual leve
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Experiência prática no cuidado de pessoas com necessidades especiais
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Palestrante motivacional sobre parentalidade atípica e inclusão
                    </p>
                  </div>
                </div>

                {/* Instagram button */}
                <div className="mt-auto pt-6 border-t border-green-100">
                  <a
                    href="https://www.instagram.com/caiomacharett/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Instagram className="w-5 h-5" />
                    <span>Seguir no Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom message */}
          <div className="text-center mt-16">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-purple-600"></div>
              <Heart className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <span className="text-gray-700 font-medium text-lg">
                Juntos por uma causa que transforma vidas
              </span>
              <Heart className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="w-12 h-0.5 bg-gradient-to-r from-green-600 via-green-400 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

          {/* Partnerships */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-center text-gray-900 mb-8">Parcerias Estratégicas</h3>
            <div className="grid md:grid-cols-3 gap-8 items-stretch justify-center">
              {/* CHS Braga - Centro de Reabilitação Neurológica */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex flex-col items-center justify-center text-center h-full">
                <Image
                  src="/logos/chs-braga.png"
                  alt="CHS Braga - Centro de Reabilitação Neurológica"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain mb-4"
                />
                <h4 className="font-semibold text-gray-900 mb-2">
                  CHS Braga - Centro de Reabilitação Neurológica
                </h4>
                <p className="text-sm text-gray-600">
                  Parceria para desenvolvimento de terapias especializadas
                </p>
              </div>

              {/* Inovar Autismo */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex flex-col items-center justify-center text-center h-full">
                <Image
                  src="/logos/inovar-autismo.png"
                  alt="Inovar Autismo"
                  width={300}
                  height={40}
                  className="h-10 w-auto object-contain mb-4"
                />
                <h4 className="font-semibold text-gray-900 mb-2">
                  Inovar Autismo
                </h4>
                <p className="text-sm text-gray-600">
                  Parceria para inovação em apoio ao autismo
                </p>
              </div>

              {/* PACT / XBoost / eGames Lab */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex flex-col items-center justify-center text-center h-full">
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src="/logos/pact.png"
                    alt="PACT"
                    width={80}
                    height={40}
                    className="h-10 w-auto object-contain rounded-md border border-gray-200"
                  />
                  <Image
                    src="/logos/xboost.png"
                    alt="XBoost"
                    width={80}
                    height={40}
                    className="h-10 w-auto object-contain rounded-md border border-gray-200"
                  />
                  <Image
                    src="/logos/egames-lab.png"
                    alt="eGames Lab"
                    width={80}
                    height={40}
                    className="h-10 w-auto object-contain rounded-md border border-gray-200"
                  />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  PACT • XBoost • eGames Lab
                </h4>
                <p className="text-sm text-gray-600">
                  Apoio institucional e aceleração no âmbito do eGames Lab
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-center text-gray-900 mb-8">Números que Falam por Si</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">250+</div>
                <div className="text-sm text-gray-600">Famílias na lista de espera</div>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Handshake className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">3</div>
                <div className="text-sm text-gray-600">Profissionais parceiros</div>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">98%</div>
                <div className="text-sm text-gray-600">Taxa de recomendação</div>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">24/7</div>
                <div className="text-sm text-gray-600">Suporte disponível</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Influencers & Ambassadors Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vozes que Amplificam a Nossa Missão
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Criadores de conteúdo e influenciadores que acreditam na nossa visão e ajudam a espalhar a mensagem
            </p>
          </div>

          {/* Featured Influencer Video */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
              {/* Phone-style Video Container */}
              <div className="mx-auto">
                <div className="relative">
                  {/* Phone Frame */}
                  <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
                    <a
                      href="https://www.instagram.com/reel/DPeCDJ0DbEM/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative group"
                    >
                      <div className="bg-black rounded-[2.5rem] overflow-hidden" style={{ width: '280px', height: '500px' }}>
                        <Image
                          src="/influencer-video-thumbnail.png"
                          alt="Influencer promovendo MindTherapy"
                          width={280}
                          height={500}
                          className="w-full h-full object-cover"
                        />
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                            <Play className="w-10 h-10 text-purple-600 ml-1" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                  {/* Instagram Link Badge */}
                  <a
                    href="https://www.instagram.com/mindtherapyportugal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
                  >
                    <Instagram className="w-4 h-4 shrink-0" />
                    <span>Ver no Instagram</span>
                  </a>
                </div>
              </div>

              {/* Info Side */}
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Stephanie Alvito</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      18K+ seguidores
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-lg italic">
                  &quot;Eu espero mesmo que este projeto chegue bem longe e que consiga ajudar famílias, e principalmente crianças.&quot;
                </p>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 text-center">
                    Quer Ajudar a Divulgar?
                  </h4>
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Criador de conteúdo? Junte-se a nós nesta causa!
                  </p>
                  <a
                    href="mailto:ola@mindtherapy.pt?subject=Parceria de Influenciador"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Colaborar Connosco</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Vozes da Nossa Comunidade</h2>
            <p className="text-xl text-gray-600">Histórias reais de transformação e esperança</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">CM</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">Carla Mendes</h4>
                  <p className="text-sm text-gray-600">Mãe do Tomás (6 anos, autismo)</p>
                </div>
                <div className="ml-auto">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">
                &quot;O MindTherapy ajudou muito o Tomás. Ele tinha dificuldade em comunicar e agora já 
                consegue usar algumas palavras e até juntar pequenas frases. Aos poucos vemos a evolução, 
                e isso deixa-nos muito felizes!&quot;
              </p>
              <p className="text-xs text-gray-500">Utilizadora Alpha • Verificado</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">RS</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">Ricardo Santos</h4>
                  <p className="text-sm text-gray-600">Pai da Beatriz (12 anos, autismo)</p>
                </div>
                <div className="ml-auto">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">
                &quot;A Beatriz sempre teve dificuldades de comunicação. Com as ferramentas adaptativas, ela
                 consegue expressar-se melhor e interagir mais facilmente com os colegas e professores.&quot;
              </p>
              <p className="text-xs text-gray-500">Utilizador Alpha • Verificado</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">AF</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-xl font-bold text-gray-900">Ana Ferreira</h4>
                  <p className="text-sm text-gray-600">Terapeuta da Fala</p>
                </div>
                <div className="ml-auto">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">
                &quot;Como profissional, recomendo o MindTherapy a todas as famílias. A tecnologia complementa
                perfeitamente o trabalho terapêutico tradicional.&quot;
              </p>
              <p className="text-xs text-gray-500">Profissional Parceiro • Verificado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Waitlist Section with Progressive Form */}
      {/* Final Waitlist Section with Progressive Form (refactor visual + UX) */}
<section
  id="waitlist-form"
  className="relative px-4 py-20 overflow-hidden bg-gradient-to-br from-purple-100 via-white to-blue-100"
>
  {/* Halos/auras suaves */}
  <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-purple-300/40 blur-3xl animate-pulse" />
  <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl animate-pulse" />

  <div className="relative z-10 max-w-4xl mx-auto text-center">
    <h2 className="text-4xl md:text-5xl font-extrabold mb-3 text-gray-900 tracking-tight">
      🌟 Junte-se à Revolução do Apoio Terapêutico
    </h2>
    <p className="text-lg md:text-xl mb-10 text-gray-600">
      Inscreva-se na lista de espera e receba acesso vitalício com{" "}
      <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
        80% de desconto
      </span>
    </p>

    {/* Benefícios em card translúcido */}
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-10 mb-10 shadow-2xl border border-purple-100 hover:shadow-purple-200/60 transition-shadow">
      <h3 className="text-2xl font-bold mb-6 text-gray-900">
        O que recebe como membro fundador:
      </h3>
      <div className="grid md:grid-cols-2 gap-5 text-left">
        {[
          "Acesso vitalício com 80% desconto",
          "Todas as funcionalidades premium incluídas",
          "Suporte prioritário 24/7",
          "Influência no desenvolvimento",
          "Acesso prioritário a novidades",
          "Comunidade exclusiva de famílias",
        ].map((txt, i) => (
          <div key={i} className="flex items-start gap-3 group">
            <CheckCircle className="mt-1 w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-gray-700">{txt}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Info de lançamento */}
    <div className="mb-10">
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-2 rounded-full border border-purple-200 text-gray-700 shadow-sm">
        <Clock className="w-5 h-5 text-purple-600 animate-pulse" />
        <span className="text-base font-semibold">Lançamento previsto: Março 2026</span>
      </div>
      <p className="mt-3 text-gray-600">
        Junte-se a mais de{" "}
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          250 famílias
        </span>{" "}
        na lista de espera
      </p>
    </div>

    {/* Formulário */}
    <div className="max-w-md mx-auto mb-6">
      <div className="bg-white/90 backdrop-blur rounded-3xl p-8 shadow-xl border border-gray-100 transition-all hover:shadow-2xl text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Junte-se à lista de espera
        </h3>
        <p className="text-gray-600 mb-6">
          Preencha o nosso formulário para garantir o seu lugar na lista de espera.
        </p>

        <a
          href="https://forms.gle/vPPDoJxYPVvA1PWE9"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full py-4 px-6 rounded-2xl font-semibold text-lg
                     text-white drop-shadow-md shadow-lg hover:shadow-xl
                     transform hover:-translate-y-0.5 transition-all duration-300
                     bg-[linear-gradient(90deg,#7c3aed,#a855f7,#ec4899,#3b82f6)]
                     bg-[length:200%_100%] animate-[gradientMove_6s_ease_infinite]"
        >
          Preencher Formulário
        </a>

        <p className="text-center text-xs text-gray-500 mt-4">
          ✅ Confirmação por e-mail • 🔒 Dados protegidos (GDPR)
        </p>
      </div>

      {/* Badges de confiança */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>100% seguro</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Sem spam</span>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Floating CTA */}
      {showFloatingCTA && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={scrollToForm}
            className="cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Gift className="w-5 h-5" />
            <span className="font-semibold">80% Desconto!</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
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
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                A primeira plataforma de apoio terapêutico especializada para pessoas neurodivergentes e com
                dificuldades de comunicação.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>
                    <a href="mailto:ola@mindtherapy.pt" className="hover:text-purple-500 transition-colors">
                      ola@mindtherapy.pt
                    </a>
                  </span>
                </div>
                <a
                  href="https://www.instagram.com/mindtherapyportugal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-500 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Recursos</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-purple-500 transition-colors">Como Funciona</a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-500 transition-colors">Preços</a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-500 transition-colors">Testemunhos</a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-500 transition-colors">FAQ</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-purple-500 transition-colors">Sobre Nós</a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-500 transition-colors">Equipa</a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-500 transition-colors">Carreiras</a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-500 transition-colors">Contactos</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-gray-500 text-sm mb-4 md:mb-0">
                © {new Date().getFullYear()} MindTherapy. Todos os direitos reservados.
              </p>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-gray-500 hover:text-purple-500 transition-colors text-sm">Termos de Serviço</a>
                <a href="#" className="text-gray-500 hover:text-purple-500 transition-colors text-sm">Política de Privacidade</a>
                <a href="#" className="text-gray-500 hover:text-purple-500 transition-colors text-sm">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
