"use client"

/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useCallback } from "react"
import {
  getPatientDocuments,
  deleteDocument,
  toggleDocumentFavorite,
  getDocumentStats,
  getDocumentDownloadUrl,
} from "@/app/actions/documents"
import type {
  PatientDocument,
  DocumentType,
  DocumentStats,
  DocumentFilter,
} from "@/types/document.types"
import {
  getDocumentTypeLabel,
  getDocumentTypeIcon,
  getDocumentTypeColor,
  formatFileSize,
  isImageFile,
  isPDFFile,
} from "@/types/document.types"
import DocumentUploadModal from "./DocumentUploadModal"

interface PatientDocumentsProps {
  patientId: string
  patientName: string
}

export default function PatientDocuments({ patientId, patientName }: PatientDocumentsProps) {
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<PatientDocument | null>(null)
  const [showViewerModal, setShowViewerModal] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [hoveredDocument, setHoveredDocument] = useState<string | null>(null)
  const [viewType, setViewType] = useState<"recent" | "category" | "timeline">("recent")

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<DocumentType | "">("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    const currentFilter: DocumentFilter = {
      ...(selectedType && { document_type: selectedType }),
      ...(showFavoritesOnly && { favorites_only: true }),
      ...(searchTerm && { search: searchTerm }),
    }

    const result = await getPatientDocuments(patientId, currentFilter)
    if (result.success && result.data) {
      setDocuments(result.data)
    }
    setIsLoading(false)
  }, [patientId, selectedType, showFavoritesOnly, searchTerm])

  const loadStats = useCallback(async () => {
    const result = await getDocumentStats(patientId)
    if (result.success && result.data) {
      setStats(result.data)
    }
  }, [patientId])

  useEffect(() => {
    loadDocuments()
    loadStats()
  }, [patientId, loadDocuments, loadStats])

  useEffect(() => {
    loadDocuments()
  }, [selectedType, showFavoritesOnly, searchTerm, loadDocuments])

  async function handleDelete(documentId: string) {
    if (!confirm("Tem a certeza que deseja eliminar este documento?")) return

    const result = await deleteDocument(documentId)
    if (result.success) {
      await loadDocuments()
      await loadStats()
      setOpenMenu(null)
    }
  }

  async function handleToggleFavorite(documentId: string, currentStatus: boolean) {
    const result = await toggleDocumentFavorite(documentId, !currentStatus)
    if (result.success) {
      await loadDocuments()
      setOpenMenu(null)
    }
  }

  async function handleDownload(documentId: string) {
    const result = await getDocumentDownloadUrl(documentId)
    if (result.success && result.data) {
      window.open(result.data, "_blank")
      setOpenMenu(null)
    }
  }

  async function handleView(document: PatientDocument) {
    setSelectedDocument(document)
    setShowViewerModal(true)
    setOpenMenu(null)
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    setShowUploadModal(true)
  }, [])

  // Multi-select handlers
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const clearSelection = () => {
    setSelectedDocuments([])
  }

  const handleBulkAction = async (action: 'delete' | 'favorite' | 'unfavorite') => {
    if (selectedDocuments.length === 0) return

    if (action === 'delete') {
      if (!confirm(`Tem a certeza que deseja eliminar ${selectedDocuments.length} documento(s)?`)) return
      
      for (const docId of selectedDocuments) {
        await deleteDocument(docId)
      }
    } else if (action === 'favorite' || action === 'unfavorite') {
      const shouldFavorite = action === 'favorite'
      
      for (const docId of selectedDocuments) {
        await toggleDocumentFavorite(docId, shouldFavorite)
      }
    }
    
    await loadDocuments()
    await loadStats()
    clearSelection()
  }

  // Get file type icon with better styling
  const getEnhancedFileIcon = (type: DocumentType, mimeType: string) => {
    const isPDF = isPDFFile(mimeType)
    const isImage = isImageFile(mimeType)
    
    if (isPDF) return { icon: '📄', color: 'text-red-600 bg-red-50' }
    if (isImage) return { icon: '🖼️', color: 'text-blue-600 bg-blue-50' }
    if (type === 'medical_report') return { icon: '🏥', color: 'text-green-600 bg-green-50' }
    if (type === 'therapy_report') return { icon: '🧠', color: 'text-purple-600 bg-purple-50' }
    if (type === 'exam_result') return { icon: '🔬', color: 'text-indigo-600 bg-indigo-50' }
    if (type === 'prescription') return { icon: '💊', color: 'text-yellow-600 bg-yellow-50' }
    return { icon: '📋', color: 'text-gray-600 bg-gray-50' }
  }

  // Group documents by category
  const groupedDocuments = documents.reduce((acc, doc) => {
    const category = getDocumentTypeLabel(doc.document_type)
    if (!acc[category]) acc[category] = []
    acc[category].push(doc)
    return acc
  }, {} as Record<string, PatientDocument[]>)

  // Get recent documents (last 30 days)
  const recentDocuments = documents.filter(doc => {
    const docDate = new Date(doc.created_at)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return docDate >= thirtyDaysAgo
  })

  // Sort documents by date for timeline view
  const timelineDocuments = [...documents].sort((a, b) => 
    new Date(b.document_date || b.created_at).getTime() - new Date(a.document_date || a.created_at).getTime()
  )

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

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documentos</h2>
          <p className="text-sm text-gray-600">Documentos de {patientName}</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Documento
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_documents}</p>
              </div>
              <div className="text-3xl">📄</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Relatórios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.medical_reports}</p>
              </div>
              <div className="text-3xl">🏥</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Exames</p>
                <p className="text-2xl font-bold text-gray-900">{stats.exam_results}</p>
              </div>
              <div className="text-3xl">🔬</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Armazenamento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(stats.total_storage_bytes || 0)}
                </p>
              </div>
              <div className="text-3xl">💾</div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Pesquisar documentos por nome, descrição ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType | "")}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-w-[180px]"
            >
              <option value="">📂 Todos os tipos</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {getDocumentTypeIcon(type)} {getDocumentTypeLabel(type)}
                </option>
              ))}
            </select>

            {/* View Type Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType("recent")}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewType === "recent" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🕒 Recentes
              </button>
              <button
                onClick={() => setViewType("category")}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewType === "category" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📁 Categorias
              </button>
              <button
                onClick={() => setViewType("timeline")}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewType === "timeline" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📅 Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Controls */}
        <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${
                showFavoritesOnly
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              ⭐ Favoritos
            </button>

            {/* Multi-select info */}
            {selectedDocuments.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">
                  {selectedDocuments.length} selecionados
                </span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
                    const favoritedCount = selectedDocs.filter(doc => doc.is_favorite).length
                    const shouldFavorite = favoritedCount < selectedDocuments.length / 2
                    
                    return (
                      <button
                        onClick={() => handleBulkAction(shouldFavorite ? 'favorite' : 'unfavorite')}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                        title={shouldFavorite ? 'Adicionar aos favoritos' : 'Remover dos favoritos'}
                      >
                        <svg className="w-4 h-4" fill={shouldFavorite ? 'none' : 'currentColor'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {shouldFavorite ? 'Favoritar' : 'Desfavoritar'}
                      </button>
                    )
                  })()}
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-red-300 text-red-700 hover:bg-red-50"
                    title="Eliminar selecionados"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50"
                    title="Limpar seleção"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 border border-gray-300 rounded-lg bg-white">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-l-md transition-colors ${
                viewMode === "grid" ? "bg-purple-100 text-purple-600" : "text-gray-600 hover:bg-gray-50"
              }`}
              title="Vista em grelha"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-r-md transition-colors ${
                viewMode === "list" ? "bg-purple-100 text-purple-600" : "text-gray-600 hover:bg-gray-50"
              }`}
              title="Vista em lista"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Documents Display */}
      <div 
        className={`${dragOver ? 'bg-purple-50 border-purple-300' : ''} transition-colors duration-200 rounded-lg`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                <div className="h-24 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-16 rounded-xl border-2 border-dashed border-purple-200 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📄</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Nenhum documento encontrado</h3>
              <p className="text-gray-600 mb-6 text-lg">
                {searchTerm || selectedType || showFavoritesOnly ? 
                  "Nenhum documento corresponde aos seus critérios de pesquisa." :
                  `Comece por adicionar o primeiro documento médico para ${patientName}.`
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md flex items-center gap-2 justify-center"
                >
                  📤 Adicionar Primeiro Documento
                </button>
                {(searchTerm || selectedType || showFavoritesOnly) && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedType("")
                      setShowFavoritesOnly(false)
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    🔄 Limpar Filtros
                  </button>
                )}
              </div>
              <div className="mt-6 text-sm text-gray-500">
                💡 Arraste ficheiros aqui para envio rápido
              </div>
            </div>
          </div>
        ) : viewType === "recent" && viewMode === "grid" ? (
          <div>
            {recentDocuments.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  🕒 Documentos Recentes <span className="text-sm font-normal text-gray-500">({recentDocuments.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {recentDocuments.slice(0, 10).map((doc) => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc}
                      hoveredDocument={hoveredDocument}
                      setHoveredDocument={setHoveredDocument}
                      selectedDocuments={selectedDocuments}
                      toggleDocumentSelection={toggleDocumentSelection}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                      handleView={handleView}
                      handleDownload={handleDownload}
                      handleToggleFavorite={handleToggleFavorite}
                      handleDelete={handleDelete}
                      getEnhancedFileIcon={getEnhancedFileIcon}
                      isImageFile={isImageFile}
                      getDocumentTypeColor={getDocumentTypeColor}
                      getDocumentTypeLabel={getDocumentTypeLabel}
                      formatFileSize={formatFileSize}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {documents.length > recentDocuments.length && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📂 Todos os Documentos <span className="text-sm font-normal text-gray-500">({documents.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {documents.map((doc) => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc}
                      hoveredDocument={hoveredDocument}
                      setHoveredDocument={setHoveredDocument}
                      selectedDocuments={selectedDocuments}
                      toggleDocumentSelection={toggleDocumentSelection}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                      handleView={handleView}
                      handleDownload={handleDownload}
                      handleToggleFavorite={handleToggleFavorite}
                      handleDelete={handleDelete}
                      getEnhancedFileIcon={getEnhancedFileIcon}
                      isImageFile={isImageFile}
                      getDocumentTypeColor={getDocumentTypeColor}
                      getDocumentTypeLabel={getDocumentTypeLabel}
                      formatFileSize={formatFileSize}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : viewType === "category" && viewMode === "grid" ? (
          <div className="space-y-8">
            {Object.entries(groupedDocuments).map(([category, categoryDocs]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {getDocumentTypeIcon(categoryDocs[0].document_type)} {category} 
                  <span className="text-sm font-normal text-gray-500">({categoryDocs.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {categoryDocs.map((doc) => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc}
                      hoveredDocument={hoveredDocument}
                      setHoveredDocument={setHoveredDocument}
                      selectedDocuments={selectedDocuments}
                      toggleDocumentSelection={toggleDocumentSelection}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                      handleView={handleView}
                      handleDownload={handleDownload}
                      handleToggleFavorite={handleToggleFavorite}
                      handleDelete={handleDelete}
                      getEnhancedFileIcon={getEnhancedFileIcon}
                      isImageFile={isImageFile}
                      getDocumentTypeColor={getDocumentTypeColor}
                      getDocumentTypeLabel={getDocumentTypeLabel}
                      formatFileSize={formatFileSize}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewType === "timeline" && viewMode === "grid" ? (
          <TimelineView 
            documents={timelineDocuments}
            hoveredDocument={hoveredDocument}
            setHoveredDocument={setHoveredDocument}
            selectedDocuments={selectedDocuments}
            toggleDocumentSelection={toggleDocumentSelection}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            handleView={handleView}
            handleDownload={handleDownload}
            handleToggleFavorite={handleToggleFavorite}
            handleDelete={handleDelete}
            getEnhancedFileIcon={getEnhancedFileIcon}
            isImageFile={isImageFile}
            getDocumentTypeColor={getDocumentTypeColor}
            getDocumentTypeLabel={getDocumentTypeLabel}
            formatFileSize={formatFileSize}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {documents.map((doc) => (
              <DocumentCard 
                key={doc.id} 
                doc={doc}
                hoveredDocument={hoveredDocument}
                setHoveredDocument={setHoveredDocument}
                selectedDocuments={selectedDocuments}
                toggleDocumentSelection={toggleDocumentSelection}
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
                handleView={handleView}
                handleDownload={handleDownload}
                handleToggleFavorite={handleToggleFavorite}
                handleDelete={handleDelete}
                getEnhancedFileIcon={getEnhancedFileIcon}
                isImageFile={isImageFile}
                getDocumentTypeColor={getDocumentTypeColor}
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        ) : viewType === "recent" && viewMode === "list" ? (
          <ListView 
            documents={recentDocuments}
            hoveredDocument={hoveredDocument}
            setHoveredDocument={setHoveredDocument}
            selectedDocuments={selectedDocuments}
            toggleDocumentSelection={toggleDocumentSelection}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            handleView={handleView}
            handleDownload={handleDownload}
            handleToggleFavorite={handleToggleFavorite}
            handleDelete={handleDelete}
            getEnhancedFileIcon={getEnhancedFileIcon}
            isImageFile={isImageFile}
            getDocumentTypeColor={getDocumentTypeColor}
            getDocumentTypeLabel={getDocumentTypeLabel}
            formatFileSize={formatFileSize}
          />
        ) : viewType === "category" && viewMode === "list" ? (
          <div className="space-y-6">
            {Object.entries(groupedDocuments).map(([category, categoryDocs]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {getDocumentTypeIcon(categoryDocs[0].document_type)} {category} 
                  <span className="text-sm font-normal text-gray-500">({categoryDocs.length})</span>
                </h3>
                <ListView 
                  documents={categoryDocs}
                  hoveredDocument={hoveredDocument}
                  setHoveredDocument={setHoveredDocument}
                  selectedDocuments={selectedDocuments}
                  toggleDocumentSelection={toggleDocumentSelection}
                  openMenu={openMenu}
                  setOpenMenu={setOpenMenu}
                  handleView={handleView}
                  handleDownload={handleDownload}
                  handleToggleFavorite={handleToggleFavorite}
                  handleDelete={handleDelete}
                  getEnhancedFileIcon={getEnhancedFileIcon}
                  isImageFile={isImageFile}
                  getDocumentTypeColor={getDocumentTypeColor}
                  getDocumentTypeLabel={getDocumentTypeLabel}
                  formatFileSize={formatFileSize}
                />
              </div>
            ))}
          </div>
        ) : viewType === "timeline" && viewMode === "list" ? (
          <div className="space-y-6">
            {Object.keys(timelineDocuments.reduce((acc, doc) => {
              const date = new Date(doc.document_date || doc.created_at).toISOString().split('T')[0]
              if (!acc[date]) acc[date] = []
              acc[date].push(doc)
              return acc
            }, {} as Record<string, PatientDocument[]>)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((date) => {
              const dateDocs = timelineDocuments.filter(doc => 
                new Date(doc.document_date || doc.created_at).toISOString().split('T')[0] === date
              )
              return (
                <div key={date}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    📅 {new Date(date).toLocaleDateString("pt-PT", { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    <span className="text-sm font-normal text-gray-500">({dateDocs.length})</span>
                  </h3>
                  <ListView 
                    documents={dateDocs}
                    hoveredDocument={hoveredDocument}
                    setHoveredDocument={setHoveredDocument}
                    selectedDocuments={selectedDocuments}
                    toggleDocumentSelection={toggleDocumentSelection}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    handleView={handleView}
                    handleDownload={handleDownload}
                    handleToggleFavorite={handleToggleFavorite}
                    handleDelete={handleDelete}
                    getEnhancedFileIcon={getEnhancedFileIcon}
                    isImageFile={isImageFile}
                    getDocumentTypeColor={getDocumentTypeColor}
                    getDocumentTypeLabel={getDocumentTypeLabel}
                    formatFileSize={formatFileSize}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <ListView 
            documents={documents}
            hoveredDocument={hoveredDocument}
            setHoveredDocument={setHoveredDocument}
            selectedDocuments={selectedDocuments}
            toggleDocumentSelection={toggleDocumentSelection}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            handleView={handleView}
            handleDownload={handleDownload}
            handleToggleFavorite={handleToggleFavorite}
            handleDelete={handleDelete}
            getEnhancedFileIcon={getEnhancedFileIcon}
            isImageFile={isImageFile}
            getDocumentTypeColor={getDocumentTypeColor}
            getDocumentTypeLabel={getDocumentTypeLabel}
            formatFileSize={formatFileSize}
          />
        )}
      </div>

      {/* Document Viewer Modal */}
      {showViewerModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedDocument.title}</h3>
              <button onClick={() => setShowViewerModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              {isImageFile(selectedDocument.mime_type) ? (
                <img src={`/api/document-preview/${selectedDocument.id}`} alt={selectedDocument.title} className="w-full" />
              ) : isPDFFile(selectedDocument.mime_type) ? (
                <iframe src={`/api/document-preview/${selectedDocument.id}`} className="w-full h-[60vh]" />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">{getDocumentTypeIcon(selectedDocument.document_type)}</div>
                  <p className="text-gray-600 mb-4">Pré-visualização não disponível para este tipo de ficheiro</p>
                  <button onClick={() => handleDownload(selectedDocument.id)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Descarregar Ficheiro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          patientId={patientId}
          patientName={patientName}
          onClose={() => setShowUploadModal(false)}
          onSuccess={async () => {
            await loadDocuments()
            await loadStats()
          }}
        />
      )}
    </div>
  )
}

// Enhanced Document Card Component
function DocumentCard({ 
  doc, 
  hoveredDocument, 
  setHoveredDocument,
  selectedDocuments,
  toggleDocumentSelection,
  openMenu,
  setOpenMenu,
  handleView,
  handleDownload,
  handleToggleFavorite,
  handleDelete,
  getEnhancedFileIcon,
  isImageFile,
  getDocumentTypeColor,
  getDocumentTypeLabel,
  formatFileSize
}: { 
  doc: PatientDocument
  hoveredDocument: string | null
  setHoveredDocument: (id: string | null) => void
  selectedDocuments: string[]
  toggleDocumentSelection: (id: string) => void
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  handleView: (doc: PatientDocument) => void
  handleDownload: (id: string) => void
  handleToggleFavorite: (id: string, current: boolean) => void
  handleDelete: (id: string) => void
  getEnhancedFileIcon: (type: DocumentType, mimeType: string) => { icon: string, color: string }
  isImageFile: (mimeType: string) => boolean
  getDocumentTypeColor: (type: DocumentType) => string
  getDocumentTypeLabel: (type: DocumentType) => string
  formatFileSize: (bytes: number) => string
}) {
  const fileIcon = getEnhancedFileIcon(doc.document_type, doc.mime_type)
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer relative"
      onMouseEnter={() => setHoveredDocument(doc.id)}
      onMouseLeave={() => setHoveredDocument(null)}
    >
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={selectedDocuments.includes(doc.id)}
          onChange={() => toggleDocumentSelection(doc.id)}
          className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Direct favorite toggle button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleFavorite(doc.id, doc.is_favorite)
          }}
          className={`p-1.5 rounded-full shadow-sm transition-all hover:scale-110 ${
            doc.is_favorite 
              ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' 
              : 'bg-white/80 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
          }`}
          title={doc.is_favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <svg className="w-3 h-3" fill={doc.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {/* Document preview/thumbnail */}
      <div 
        className="relative h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center cursor-pointer"
        onClick={() => handleView(doc)}
      >
        {isImageFile(doc.mime_type) ? (
          <img 
            src={`/api/document-preview/${doc.id}`} 
            alt={doc.title} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${fileIcon.color}`}>
            <span className="text-2xl">{fileIcon.icon}</span>
          </div>
        )}
        
        {/* Hover preview overlay */}
        {hoveredDocument === doc.id && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-2 shadow-lg">
              <span className="text-sm font-medium text-gray-900">👁️ Pré-visualizar</span>
            </div>
          </div>
        )}
      </div>

      {/* Document info */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 flex-1 pr-2">
            {doc.title}
          </h3>
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenu(openMenu === doc.id ? null : doc.id)
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {openMenu === doc.id && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)}></div>
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button onClick={() => handleView(doc)} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                    👁️ Visualizar
                  </button>
                  <button onClick={() => handleDownload(doc.id)} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                    ⬇️ Descarregar
                  </button>
                  <button onClick={() => handleToggleFavorite(doc.id, doc.is_favorite)} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                    {doc.is_favorite ? "💔" : "⭐"} {doc.is_favorite ? "Remover favorito" : "Favorito"}
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm">
                    🗑️ Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Type badge */}
        <div className={`text-xs px-2 py-1 rounded-full inline-block mb-2 font-medium ${getDocumentTypeColor(doc.document_type)}`}>
          {getDocumentTypeLabel(doc.document_type)}
        </div>
        
        {/* Description */}
        {doc.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
            {doc.description}
          </p>
        )}
        
        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium">{formatFileSize(doc.file_size)}</span>
          <span>{new Date(doc.created_at).toLocaleDateString("pt-PT", { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </div>
  )
}

// List View Component
function ListView({
  documents,
  hoveredDocument, 
  setHoveredDocument,
  selectedDocuments,
  toggleDocumentSelection,
  openMenu,
  setOpenMenu,
  handleView,
  handleDownload,
  handleToggleFavorite,
  handleDelete,
  getEnhancedFileIcon,
  isImageFile,
  getDocumentTypeColor,
  getDocumentTypeLabel,
  formatFileSize
}: { 
  documents: PatientDocument[]
  hoveredDocument: string | null
  setHoveredDocument: (id: string | null) => void
  selectedDocuments: string[]
  toggleDocumentSelection: (id: string) => void
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  handleView: (doc: PatientDocument) => void
  handleDownload: (id: string) => void
  handleToggleFavorite: (id: string, current: boolean) => void
  handleDelete: (id: string) => void
  getEnhancedFileIcon: (type: DocumentType, mimeType: string) => { icon: string, color: string }
  isImageFile: (mimeType: string) => boolean
  getDocumentTypeColor: (type: DocumentType) => string
  getDocumentTypeLabel: (type: DocumentType) => string
  formatFileSize: (bytes: number) => string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
      {documents.map((doc, index) => {
        const fileIcon = getEnhancedFileIcon(doc.document_type, doc.mime_type)
        
        return (
          <div key={doc.id} className={`flex items-center p-4 hover:bg-gray-50 ${index !== 0 ? "border-t border-gray-200" : ""}`}>
            {/* Selection checkbox */}
            <div className="mr-3">
              <input
                type="checkbox"
                checked={selectedDocuments.includes(doc.id)}
                onChange={() => toggleDocumentSelection(doc.id)}
                className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500"
              />
            </div>

            {/* Document icon */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${fileIcon.color}`}>
              <span className="text-2xl">{fileIcon.icon}</span>
            </div>

            {/* Document info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleFavorite(doc.id, doc.is_favorite)
                  }}
                  className={`p-1 rounded-full transition-all hover:scale-110 ${
                    doc.is_favorite 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                  title={doc.is_favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <svg className="w-4 h-4" fill={doc.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 truncate">{doc.description || doc.file_name}</p>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-6 mr-4">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDocumentTypeColor(doc.document_type)}`}>
                {getDocumentTypeLabel(doc.document_type)}
              </span>
              <span className="text-sm text-gray-600 font-medium">{formatFileSize(doc.file_size)}</span>
              <span className="text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString("pt-PT")}</span>
            </div>

            {/* Actions menu */}
            <div className="relative">
              <button 
                onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)} 
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
              {openMenu === doc.id && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)}></div>
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button onClick={() => handleView(doc)} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                      👁️ Visualizar
                    </button>
                    <button onClick={() => handleDownload(doc.id)} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                      ⬇️ Descarregar
                    </button>
                    <button onClick={() => handleToggleFavorite(doc.id, doc.is_favorite)} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                      {doc.is_favorite ? "💔" : "⭐"} {doc.is_favorite ? "Remover favorito" : "Favorito"}
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm">
                      🗑️ Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Timeline View Component
function TimelineView({ 
  documents,
  hoveredDocument, 
  setHoveredDocument,
  selectedDocuments,
  toggleDocumentSelection,
  openMenu,
  setOpenMenu,
  handleView,
  handleDownload,
  handleToggleFavorite,
  handleDelete,
  getEnhancedFileIcon,
  isImageFile,
  getDocumentTypeColor,
  getDocumentTypeLabel,
  formatFileSize
}: { 
  documents: PatientDocument[]
  hoveredDocument: string | null
  setHoveredDocument: (id: string | null) => void
  selectedDocuments: string[]
  toggleDocumentSelection: (id: string) => void
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  handleView: (doc: PatientDocument) => void
  handleDownload: (id: string) => void
  handleToggleFavorite: (id: string, current: boolean) => void
  handleDelete: (id: string) => void
  getEnhancedFileIcon: (type: DocumentType, mimeType: string) => { icon: string, color: string }
  isImageFile: (mimeType: string) => boolean
  getDocumentTypeColor: (type: DocumentType) => string
  getDocumentTypeLabel: (type: DocumentType) => string
  formatFileSize: (bytes: number) => string
}) {
  // Group documents by date
  const groupedByDate = documents.reduce((acc, doc) => {
    const date = new Date(doc.document_date || doc.created_at).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(doc)
    return acc
  }, {} as Record<string, PatientDocument[]>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div className="space-y-6">
      {sortedDates.map((date, dateIndex) => {
        const docs = groupedByDate[date]
        const dateObj = new Date(date)
        const isToday = date === new Date().toISOString().split('T')[0]
        const isThisWeek = (new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24) <= 7
        
        return (
          <div key={date} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${isToday ? 'bg-purple-500' : isThisWeek ? 'bg-blue-400' : 'bg-gray-300'} border-2 border-white shadow-sm`}></div>
              {dateIndex < sortedDates.length - 1 && (
                <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {isToday ? '🕒 Hoje' : dateObj.toLocaleDateString('pt-PT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className="text-sm text-gray-500">{docs.length} documento{docs.length > 1 ? 's' : ''}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {docs.map((doc) => (
                  <DocumentCard 
                    key={doc.id} 
                    doc={doc}
                    hoveredDocument={hoveredDocument}
                    setHoveredDocument={setHoveredDocument}
                    selectedDocuments={selectedDocuments}
                    toggleDocumentSelection={toggleDocumentSelection}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    handleView={handleView}
                    handleDownload={handleDownload}
                    handleToggleFavorite={handleToggleFavorite}
                    handleDelete={handleDelete}
                    getEnhancedFileIcon={getEnhancedFileIcon}
                    isImageFile={isImageFile}
                    getDocumentTypeColor={getDocumentTypeColor}
                    getDocumentTypeLabel={getDocumentTypeLabel}
                    formatFileSize={formatFileSize}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}