import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from("patient_documents")
      .select("file_path, mime_type")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Get file from storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from("patient-documents")
      .download(document.file_path)

    if (storageError || !fileData) {
      return NextResponse.json({ error: "Failed to load file" }, { status: 500 })
    }

    // Return file with appropriate headers
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": document.mime_type,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error in document preview:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
