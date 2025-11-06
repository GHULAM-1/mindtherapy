"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Bell,
  Palette,
  Globe,
  Save,
  ArrowLeft,
  Camera,
  Shield,
  CheckCircle,
} from "lucide-react"
import type { Profile } from "@/types/database.types"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "preferences">("profile")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneCountryCode: "",
    phone: "",
    bio: "",
    organization: "",
    role: "",
    notification_email: true,
    notification_push: true,
    notification_sms: false,
    theme: "light" as "light" | "dark",
    language: "pt",
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setUserProfile(profile)

          setFormData({
            name: profile.full_name || "",
            email: profile.email || "",
            phoneCountryCode: profile.phone_country_code || "",
            phone: profile.phone || "",
            bio: profile.bio || "",
            organization: profile.organization || "",
            role: profile.role || "",
            notification_email: profile.notification_preferences?.email ?? true,
            notification_push: profile.notification_preferences?.push ?? true,
            notification_sms: profile.notification_preferences?.sms ?? false,
            theme: profile.theme_preference || "light",
            language: profile.language_preference || "pt",
          })
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url)
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router, supabase])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return

    try {
      setUploadingAvatar(true)

      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userProfile.id)

      if (updateError) throw updateError

      setUserProfile({ ...userProfile, avatar_url: publicUrl })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Erro ao carregar imagem. Tente novamente.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userProfile) return

    // Validate that if phone is provided, country code must be selected
    const cleanPhone = formData.phone.replace(/\s+/g, '')
    if (cleanPhone && !formData.phoneCountryCode) {
      alert("Por favor, selecione o indicativo do país para o número de telefone.")
      return
    }

    try {
      setIsSaving(true)

      console.log("Saving phone:", {
        countryCode: formData.phoneCountryCode,
        phoneNumber: cleanPhone,
      })

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.name,
          phone_country_code: formData.phoneCountryCode,
          phone: cleanPhone,
          bio: formData.bio,
          organization: formData.organization,
          role: formData.role,
          notification_preferences: {
            email: formData.notification_email,
            push: formData.notification_push,
            sms: formData.notification_sms,
          },
          theme_preference: formData.theme,
          language_preference: formData.language,
        })
        .eq("id", userProfile.id)

      if (error) throw error

      // Reload profile to get updated data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userProfile.id)
        .single()

      if (updatedProfile) {
        setUserProfile(updatedProfile)
      }

      alert("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Erro ao guardar alterações. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">A carregar definições...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Definições</h1>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "profile"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <User className="w-5 h-5" />
                  Perfil
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "notifications"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  Notificações
                </button>
                <button
                  onClick={() => setActiveTab("preferences")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "preferences"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Palette className="w-5 h-5" />
                  Preferências
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Informação do Perfil</h2>

                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                      <div className="relative">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt="Avatar"
                            width={96}
                            height={96}
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                              {formData.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors"
                        >
                          {uploadingAvatar ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Foto de Perfil</h3>
                        <p className="text-sm text-gray-600">JPG, PNG ou GIF. Máximo 5MB.</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Telefone
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={formData.phoneCountryCode}
                            onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                            className="w-40 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          >
                            <option value="" disabled>Selecionar</option>
                            <option value="+351">🇵🇹 +351</option>
                            <option value="+34">🇪🇸 +34</option>
                            <option value="+33">🇫🇷 +33</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+49">🇩🇪 +49</option>
                            <option value="+39">🇮🇹 +39</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+55">🇧🇷 +55</option>
                            <option value="+244">🇦🇴 +244</option>
                            <option value="+258">🇲🇿 +258</option>
                          </select>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d\s]/g, '') })}
                            disabled={!formData.phoneCountryCode}
                            className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              !formData.phoneCountryCode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                            }`}
                            placeholder={formData.phoneCountryCode ? "912 345 678" : "Selecione o indicativo primeiro"}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Briefcase className="w-4 h-4 inline mr-2" />
                          Função/Profissão
                        </label>
                        <input
                          type="text"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Ex: Psicólogo(a)"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building className="w-4 h-4 inline mr-2" />
                          Organização/Instituição
                        </label>
                        <input
                          type="text"
                          value={formData.organization}
                          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Ex: Centro de Apoio Terapêutico"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Biografia</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Conte um pouco sobre si e a sua experiência..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Notificações</h2>
                    <p className="text-gray-600 mb-6">Gerir como recebe notificações da plataforma.</p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Notificações por Email</h3>
                            <p className="text-sm text-gray-600">Receba atualizações importantes por email</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notification_email}
                            onChange={(e) =>
                              setFormData({ ...formData, notification_email: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Notificações Push</h3>
                            <p className="text-sm text-gray-600">Receba notificações no navegador</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notification_push}
                            onChange={(e) => setFormData({ ...formData, notification_push: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Notificações por SMS</h3>
                            <p className="text-sm text-gray-600">Receba alertas urgentes por SMS</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notification_sms}
                            onChange={(e) => setFormData({ ...formData, notification_sms: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Preferências</h2>
                    <p className="text-gray-600 mb-6">Personalize a sua experiência na plataforma.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Palette className="w-4 h-4 inline mr-2" />
                          Tema da Interface
                        </label>
                        <select
                          value={formData.theme}
                          onChange={(e) => setFormData({ ...formData, theme: e.target.value as "light" | "dark" })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="light">☀️ Claro</option>
                          <option value="dark">🌙 Escuro</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Globe className="w-4 h-4 inline mr-2" />
                          Idioma da Interface
                        </label>
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="pt">🇵🇹 Português</option>
                          <option value="en">🇬🇧 English</option>
                          <option value="es">🇪🇸 Español</option>
                        </select>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                        <div className="flex gap-3">
                          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-blue-900 mb-1">Privacidade e Segurança</h3>
                            <p className="text-sm text-blue-700 mb-2">
                              Os seus dados estão protegidos e encriptados. Cumprimos o RGPD.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-blue-700">
                              <CheckCircle className="w-4 h-4" />
                              <span>Certificação GDPR</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
