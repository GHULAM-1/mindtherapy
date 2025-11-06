"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  PatientDocument,
  DocumentWithCategories,
  UpdateDocumentData,
  DocumentStats,
  DocumentFilter,
} from "@/types/document.types"

interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get all documents for a specific patient
 */
export async function getPatientDocuments(
  patientId: string,
  filter?: DocumentFilter
): Promise<ActionResult<DocumentWithCategories[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Build query
    let query = supabase
      .from("patient_documents")
      .select("*")
      .eq("patient_id", patientId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Apply filters
    if (filter?.document_type) {
      query = query.eq("document_type", filter.document_type)
    }

    if (filter?.favorites_only) {
      query = query.eq("is_favorite", true)
    }

    if (filter?.date_from) {
      query = query.gte("document_date", filter.date_from)
    }

    if (filter?.date_to) {
      query = query.lte("document_date", filter.date_to)
    }

    if (filter?.tags && filter.tags.length > 0) {
      query = query.contains("tags", filter.tags)
    }

    const { data: documents, error: docsError } = await query

    if (docsError) {
      console.error("Error fetching documents:", docsError)
      return { success: false, error: "Erro ao carregar documentos" }
    }

    // Filter by search term if provided (client-side for now)
    let filteredDocs = documents || []
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase()
      filteredDocs = filteredDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.file_name.toLowerCase().includes(searchLower)
      )
    }

    return { success: true, data: filteredDocs }
  } catch (error) {
    console.error("Unexpected error in getPatientDocuments:", error)
    return { success: false, error: "Erro inesperado ao carregar documentos" }
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<ActionResult<PatientDocument>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    const { data: document, error: docError } = await supabase
      .from("patient_documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (docError) {
      console.error("Error fetching document:", docError)
      return { success: false, error: "Documento não encontrado" }
    }

    return { success: true, data: document }
  } catch (error) {
    console.error("Unexpected error in getDocument:", error)
    return { success: false, error: "Erro inesperado ao carregar documento" }
  }
}

/**
 * Upload a new document
 */
export async function uploadDocument(
  patientId: string,
  title: string,
  documentType: string,
  file: File,
  description?: string,
  documentDate?: string,
  tags?: string[]
): Promise<ActionResult<PatientDocument>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Verify patient belongs to user
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("user_id", user.id)
      .single()

    if (!patient) {
      return { success: false, error: "Paciente não encontrado" }
    }

    // Upload file to storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${patientId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from("patient-documents").upload(fileName, file)

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { success: false, error: "Erro ao fazer upload do ficheiro" }
    }

    // Get file URL
    supabase.storage.from("patient-documents").getPublicUrl(fileName)

    // Create document record
    const { data: document, error: createError } = await supabase
      .from("patient_documents")
      .insert({
        patient_id: patientId,
        user_id: user.id,
        title,
        description: description || null,
        document_type: documentType,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        document_date: documentDate || null,
        tags: tags || null,
        is_favorite: false,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating document:", createError)
      // Try to delete uploaded file
      await supabase.storage.from("patient-documents").remove([fileName])
      return { success: false, error: "Erro ao criar registo do documento" }
    }

    revalidatePath(`/dashboard/patient/${patientId}`)
    return { success: true, data: document }
  } catch (error) {
    console.error("Unexpected error in uploadDocument:", error)
    return { success: false, error: "Erro inesperado ao fazer upload" }
  }
}

/**
 * Update document metadata
 */
export async function updateDocument(
  documentId: string,
  data: UpdateDocumentData
): Promise<ActionResult<PatientDocument>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    const { data: document, error: updateError } = await supabase
      .from("patient_documents")
      .update(data)
      .eq("id", documentId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating document:", updateError)
      return { success: false, error: "Erro ao atualizar documento" }
    }

    revalidatePath(`/dashboard/patient/${document.patient_id}`)
    return { success: true, data: document }
  } catch (error) {
    console.error("Unexpected error in updateDocument:", error)
    return { success: false, error: "Erro inesperado ao atualizar documento" }
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Get document to delete file from storage
    const { data: document } = await supabase
      .from("patient_documents")
      .select("file_path, patient_id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (!document) {
      return { success: false, error: "Documento não encontrado" }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("patient-documents").remove([document.file_path])

    if (storageError) {
      console.error("Error deleting file from storage:", storageError)
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("patient_documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error deleting document:", deleteError)
      return { success: false, error: "Erro ao eliminar documento" }
    }

    revalidatePath(`/dashboard/patient/${document.patient_id}`)
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteDocument:", error)
    return { success: false, error: "Erro inesperado ao eliminar documento" }
  }
}

/**
 * Toggle favorite status
 */
export async function toggleDocumentFavorite(documentId: string, isFavorite: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    const { data: document, error: updateError } = await supabase
      .from("patient_documents")
      .update({ is_favorite: isFavorite })
      .eq("id", documentId)
      .eq("user_id", user.id)
      .select("patient_id")
      .single()

    if (updateError) {
      console.error("Error toggling favorite:", updateError)
      return { success: false, error: "Erro ao atualizar favorito" }
    }

    revalidatePath(`/dashboard/patient/${document.patient_id}`)
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in toggleDocumentFavorite:", error)
    return { success: false, error: "Erro inesperado" }
  }
}

/**
 * Get document statistics for a patient
 */
export async function getDocumentStats(patientId: string): Promise<ActionResult<DocumentStats>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    const { data: stats, error: statsError } = await supabase
      .from("document_stats")
      .select("*")
      .eq("patient_id", patientId)
      .eq("user_id", user.id)
      .single()

    if (statsError) {
      console.error("Error fetching document stats:", statsError)
      return { success: false, error: "Erro ao carregar estatísticas" }
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error("Unexpected error in getDocumentStats:", error)
    return { success: false, error: "Erro inesperado ao carregar estatísticas" }
  }
}

/**
 * Download a document
 */
export async function getDocumentDownloadUrl(documentId: string): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Não autenticado" }
    }

    // Get document
    const { data: document } = await supabase
      .from("patient_documents")
      .select("file_path")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (!document) {
      return { success: false, error: "Documento não encontrado" }
    }

    // Generate signed URL (valid for 60 seconds)
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(document.file_path, 60)

    if (error) {
      console.error("Error creating signed URL:", error)
      return { success: false, error: "Erro ao gerar link de download" }
    }

    return { success: true, data: data.signedUrl }
  } catch (error) {
    console.error("Unexpected error in getDocumentDownloadUrl:", error)
    return { success: false, error: "Erro inesperado ao gerar link" }
  }
}
