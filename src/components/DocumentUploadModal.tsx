"use client"

import { useState, useRef } from "react"
import { uploadDocument } from "@/app/actions/documents"
import type { DocumentType } from "@/types/document.types"
import { getDocumentTypeLabel, getDocumentTypeIcon } from "@/types/document.types"

interface DocumentUploadModalProps {
  patientId: string
  patientName: string
  onClose: () => void
  onSuccess: () => void
}

export default function DocumentUploadModal({
  patientId,
  patientName,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    document_type: "" as DocumentType | "",
    document_date: "",
    tags: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const documentTypes: DocumentType[] = [
    "medical_report",
    "therapy_report",
    "exam_result",
    "prescription",
    "diagnosis",
    "progress_note",
    "school_report",
    "assessment",
    "photo",
    "video",
    "other",
  ]

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    // Auto-fill title with filename if empty
    if (!formData.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      setFormData({ ...formData, title: nameWithoutExt })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !formData.title || !formData.document_type) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const result = await uploadDocument(
        patientId,
        formData.title,
        formData.document_type,
        selectedFile,
        formData.description || undefined,
        formData.document_date || undefined,
        tags.length > 0 ? tags : undefined
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 500)
      } else {
        alert(result.error || "Erro ao fazer upload do documento")
        setIsUploading(false)
        setUploadProgress(0)
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Erro inesperado ao fazer upload")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Adicionar Documento</h3>
            <p className="text-sm text-gray-600">Para {patientName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ficheiro *
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-purple-500 bg-purple-50"
                  : selectedFile
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-purple-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.webm"
              />
              {selectedFile ? (
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-sm text-purple-600 mt-2">Clique para alterar</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📤</div>
                  <p className="font-semibold text-gray-900 mb-1">
                    Arraste um ficheiro ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-600">
                    PDF, DOC, DOCX, JPG, PNG, GIF, MP4, WEBM
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Tamanho máximo: 50MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Relatório de Consulta - Janeiro 2025"
              required
              disabled={isUploading}
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento *
            </label>
            <select
              value={formData.document_type}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value as DocumentType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isUploading}
            >
              <option value="">Selecione o tipo</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {getDocumentTypeIcon(type)} {getDocumentTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Informações adicionais sobre o documento..."
              disabled={isUploading}
            />
          </div>

          {/* Document Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data do Documento
            </label>
            <input
              type="date"
              value={formData.document_date}
              onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Data do conteúdo do documento (ex: data da consulta, data do exame)
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiquetas
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="urgente, consulta, exame, etc. (separar por vírgulas)"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Adicione etiquetas para facilitar a pesquisa
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  A carregar documento...
                </span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !formData.title || !formData.document_type}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  A carregar...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Carregar Documento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
