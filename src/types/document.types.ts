/**
 * Document Types
 * Types for the patient documents system
 */

export type DocumentType =
  | 'medical_report'
  | 'therapy_report'
  | 'exam_result'
  | 'prescription'
  | 'diagnosis'
  | 'progress_note'
  | 'school_report'
  | 'assessment'
  | 'photo'
  | 'video'
  | 'other'

export interface PatientDocument {
  id: string
  patient_id: string
  user_id: string
  title: string
  description: string | null
  document_type: DocumentType
  file_name: string
  file_path: string
  file_size: number // bytes
  mime_type: string
  document_date: string | null // ISO date string
  tags: string[] | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface DocumentCategory {
  id: string
  user_id: string
  name: string
  color: string
  icon: string | null
  created_at: string
}

export interface DocumentWithCategories extends PatientDocument {
  categories?: DocumentCategory[]
}

export interface DocumentStats {
  patient_id: string
  user_id: string
  total_documents: number
  medical_reports: number
  exam_results: number
  photos: number
  videos: number
  total_storage_bytes: number
  last_upload_date: string | null
}

export interface CreateDocumentData {
  patient_id: string
  title: string
  description?: string
  document_type: DocumentType
  file: File
  document_date?: string
  tags?: string[]
  is_favorite?: boolean
}

export interface UpdateDocumentData {
  title?: string
  description?: string
  document_type?: DocumentType
  document_date?: string
  tags?: string[]
  is_favorite?: boolean
}

export interface DocumentFilter {
  document_type?: DocumentType
  tags?: string[]
  search?: string
  date_from?: string
  date_to?: string
  favorites_only?: boolean
}

// Helper function to get document type label in Portuguese
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    medical_report: 'Relatório Médico',
    therapy_report: 'Relatório de Terapia',
    exam_result: 'Resultado de Exame',
    prescription: 'Prescrição',
    diagnosis: 'Diagnóstico',
    progress_note: 'Nota de Progresso',
    school_report: 'Relatório Escolar',
    assessment: 'Avaliação',
    photo: 'Fotografia',
    video: 'Vídeo',
    other: 'Outro',
  }
  return labels[type] || type
}

// Helper function to get document type icon
export function getDocumentTypeIcon(type: DocumentType): string {
  const icons: Record<DocumentType, string> = {
    medical_report: '🏥',
    therapy_report: '💭',
    exam_result: '🔬',
    prescription: '💊',
    diagnosis: '📋',
    progress_note: '📝',
    school_report: '🎓',
    assessment: '📊',
    photo: '📷',
    video: '🎥',
    other: '📄',
  }
  return icons[type] || '📄'
}

// Helper function to get document type color
export function getDocumentTypeColor(type: DocumentType): string {
  const colors: Record<DocumentType, string> = {
    medical_report: 'bg-red-100 text-red-800',
    therapy_report: 'bg-purple-100 text-purple-800',
    exam_result: 'bg-blue-100 text-blue-800',
    prescription: 'bg-pink-100 text-pink-800',
    diagnosis: 'bg-orange-100 text-orange-800',
    progress_note: 'bg-green-100 text-green-800',
    school_report: 'bg-yellow-100 text-yellow-800',
    assessment: 'bg-indigo-100 text-indigo-800',
    photo: 'bg-cyan-100 text-cyan-800',
    video: 'bg-teal-100 text-teal-800',
    other: 'bg-gray-100 text-gray-800',
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Helper function to check if file is an image
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

// Helper function to check if file is a video
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

// Helper function to check if file is a PDF
export function isPDFFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

// Helper function to get file extension from mime type
export function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  }
  return extensions[mimeType] || 'file'
}
