"use client"

import { useState, useEffect, useRef } from "react"
import { UploadCustomToast } from "./upload-custom-toast"

interface FileUpload {
  id: string
  name: string
  status: "uploading" | "error" | "success"
  errorMessage?: string
  errorType?: "validation" | "processing"
}

const AUTO_DISMISS_TIMEOUT = 30000

const PROCESSING_ERRORS = [
  "Failed to process due to OCR issue",
  "File is locked, password is required",
  "Something went wrong. Please try again.",
]

export function UploadToast() {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null)

  const checkFilesStatus = () => {
    if (files.length === 0) return
    const hasUploading = files.some(f => f.status === "uploading")
    if (hasUploading) return

    const hasErrors = files.some(f => f.status === "error")

    const event = new CustomEvent("fileUploadStatus", { bubbles: true, detail: { hasErrors } })
    document.dispatchEvent(event)

    if (hasErrors) {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current)
        autoDismissTimerRef.current = null
      }
      return
    }

    if (!autoDismissTimerRef.current) {
      autoDismissTimerRef.current = setTimeout(() => {
        setIsVisible(false)
        autoDismissTimerRef.current = null
      }, AUTO_DISMISS_TIMEOUT)
    }
  }

  useEffect(() => {
    checkFilesStatus()
    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current)
    }
  }, [files])

  const handleDeleteFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id)
      if (updated.length === 0) {
        setIsVisible(false)
        document.dispatchEvent(new CustomEvent("fileUploadStatus", { bubbles: true, detail: { resetErrors: true } }))
      }
      return updated
    })
  }

  const handleCloseToast = () => {
    setIsVisible(false)
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current)
      autoDismissTimerRef.current = null
    }
  }

  useEffect(() => {
    const handleFileSelect = (event: CustomEvent) => {
      const { validFiles, invalidFiles } = event.detail
      if ((!validFiles || validFiles.length === 0) && (!invalidFiles || invalidFiles.length === 0)) return

      const newFiles: FileUpload[] = [
        ...(validFiles || []).map((file: { name: string }) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          status: "uploading" as const,
        })),
        ...(invalidFiles || []).map(({ file, reason }: { file: { name: string }; reason: string }) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          status: "error" as const,
          errorMessage: reason,
          errorType: "validation" as const,
        })),
      ]

      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current)
        autoDismissTimerRef.current = null
      }

      setIsVisible(true)
      setFiles(prev => [...prev, ...newFiles])

      newFiles.forEach(fileUpload => {
        if (fileUpload.status === "uploading") {
          setTimeout(() => {
            const outcome = Math.random()

            if (outcome > 0.1) {
              setFiles(prev => prev.map(f => f.id === fileUpload.id ? { ...f, status: "success" } : f))
              document.dispatchEvent(new CustomEvent("fileUploadComplete", {
                bubbles: true,
                detail: { fileName: fileUpload.name, fileId: fileUpload.id },
              }))
            } else {
              const errorIndex = Math.floor(Math.random() * PROCESSING_ERRORS.length)
              setFiles(prev => prev.map(f => f.id === fileUpload.id ? { ...f, status: "error", errorMessage: PROCESSING_ERRORS[errorIndex], errorType: "processing" } : f))
            }
          }, Math.random() * 2000 + 2000)
        }
      })
    }

    const handleShowErrors = () => {
      if (files.some(f => f.status === "error")) setIsVisible(true)
    }

    document.addEventListener("fileSelect", handleFileSelect as EventListener)
    document.addEventListener("showUploadErrors", handleShowErrors as EventListener)
    return () => {
      document.removeEventListener("fileSelect", handleFileSelect as EventListener)
      document.removeEventListener("showUploadErrors", handleShowErrors as EventListener)
    }
  }, [files])

  if (!isVisible) return null

  return <UploadCustomToast files={files} onDelete={handleDeleteFile} onClose={handleCloseToast} />
}
