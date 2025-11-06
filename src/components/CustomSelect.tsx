"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

interface Option {
  value: string
  label: string
  icon?: string
  group?: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  error?: string
  label?: string
  required?: boolean
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção",
  error,
  label,
  required = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Group options
  const groupedOptions = options.reduce(
    (acc, option) => {
      const group = option.group || "default"
      if (!acc[group]) acc[group] = []
      acc[group].push(option)
      return acc
    },
    {} as Record<string, Option[]>,
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (isOpen && focusedIndex >= 0) {
        handleSelect(options[focusedIndex].value)
      } else {
        setIsOpen(!isOpen)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Custom Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full px-4 py-3 bg-white text-left border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all flex items-center justify-between ${
          error ? "border-red-300 bg-red-50" : "border-gray-300"
        } ${isOpen ? "ring-2 ring-purple-500 border-transparent" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
        />
      </button>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
          {Object.entries(groupedOptions).map(([group, groupOptions]) => (
            <div key={group}>
              {group !== "default" && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                  {group}
                </div>
              )}
              {groupOptions.map((option) => {
                const globalIndex = options.indexOf(option)
                const isSelected = option.value === value
                const isFocused = globalIndex === focusedIndex

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setFocusedIndex(globalIndex)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-purple-50 text-purple-700"
                        : isFocused
                          ? "bg-gray-50 text-gray-900"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon && <span>{option.icon}</span>}
                      {option.label}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-purple-600" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
