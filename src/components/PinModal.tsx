"use client"

import { useState, useRef, useEffect } from "react"
import { X, Lock } from "lucide-react"

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (pin: string) => void
  mode: "setup" | "verify"
  title: string
  description: string
  storedPin?: string
}

export default function PinModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  title,
  description,
  storedPin,
}: PinModalProps) {
  const [pin, setPin] = useState(["", "", "", "", "", ""])
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""])
  const [step, setStep] = useState<"create" | "confirm" | "verify">(mode === "setup" ? "create" : "verify")
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setPin(["", "", "", "", "", ""])
      setConfirmPin(["", "", "", "", "", ""])
      setStep(mode === "setup" ? "create" : "verify")
      setError("")
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen, mode])

  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const currentPin = isConfirm ? [...confirmPin] : [...pin]
    currentPin[index] = value

    if (isConfirm) {
      setConfirmPin(currentPin)
    } else {
      setPin(currentPin)
    }

    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if all fields are filled
    if (index === 5 && value) {
      if (step === "verify") {
        // Verify PIN
        const enteredPin = currentPin.join("")
        if (enteredPin === storedPin) {
          onSuccess(enteredPin)
        } else {
          setError("PIN incorreto. Tenta novamente.")
          setTimeout(() => {
            setPin(["", "", "", "", "", ""])
            inputRefs.current[0]?.focus()
          }, 1000)
        }
      } else if (step === "create") {
        // Move to confirm step
        setStep("confirm")
        setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 100)
      } else if (step === "confirm") {
        // Check if PINs match
        const createdPin = pin.join("")
        const confirmedPin = currentPin.join("")
        if (createdPin === confirmedPin) {
          onSuccess(createdPin)
        } else {
          setError("Os PINs não coincidem. Tenta novamente.")
          setTimeout(() => {
            setStep("create")
            setPin(["", "", "", "", "", ""])
            setConfirmPin(["", "", "", "", "", ""])
            inputRefs.current[0]?.focus()
          }, 1500)
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, isConfirm: boolean = false) => {
    const currentPin = isConfirm ? confirmPin : pin

    if (e.key === "Backspace" && !currentPin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent, isConfirm: boolean = false) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData("text").slice(0, 6)
    if (/^\d+$/.test(pasteData)) {
      const digits = pasteData.split("")
      const currentPin = isConfirm ? [...confirmPin] : [...pin]
      digits.forEach((digit, i) => {
        if (i < 6) currentPin[i] = digit
      })
      if (isConfirm) {
        setConfirmPin(currentPin)
      } else {
        setPin(currentPin)
      }
      // Focus last filled input or first empty
      const nextIndex = Math.min(digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
          {step === "confirm" && (
            <p className="text-purple-600 font-medium mt-2">Confirma o teu PIN</p>
          )}
        </div>

        {/* PIN Input */}
        <div className="flex gap-3 justify-center mb-6">
          {(step === "confirm" ? confirmPin : pin).map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value, step === "confirm")}
              onKeyDown={(e) => handleKeyDown(index, e, step === "confirm")}
              onPaste={(e) => handlePaste(e, step === "confirm")}
              className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all focus:outline-none focus:scale-110 ${
                error
                  ? "border-red-500 bg-red-50"
                  : digit
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-center mb-4">
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          {mode === "setup" ? (
            step === "create" ? (
              <p>Cria um PIN de 6 dígitos para proteger o acesso</p>
            ) : (
              <p>Introduz novamente o PIN para confirmar</p>
            )
          ) : (
            <p>Introduz o PIN para sair da área da criança</p>
          )}
        </div>
      </div>
    </div>
  )
}
