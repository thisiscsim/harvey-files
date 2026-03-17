"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { SpinnerIcon, BigSuccessCheckIcon, BigErrorAlertIcon, SuccessIcon, UploadingIcon, SomethingWrongIcon } from "./upload-icons"
import { X, ChevronUp, ChevronDown, Trash } from "lucide-react"

interface FileUpload {
  id: string
  name: string
  status: "uploading" | "error" | "success"
  errorMessage?: string
  errorType?: "validation" | "processing"
}

interface UploadCustomToastProps {
  files: FileUpload[]
  onDelete: (id: string) => void
  onClose?: () => void
}

export function UploadCustomToast({ files, onDelete, onClose }: UploadCustomToastProps) {
  const [mounted, setMounted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [animatingFiles, setAnimatingFiles] = useState<Record<string, { sliding: boolean; collapsing: boolean }>>({})
  const animationTimeoutsRef = useRef<Record<string, NodeJS.Timeout[]>>({})

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => {
      clearTimeout(timer)
      setMounted(false)
      Object.values(animationTimeoutsRef.current).forEach(timeouts => timeouts.forEach(t => clearTimeout(t)))
    }
  }, [])

  const processingErrorFiles = files.filter(f => f.status === "error" && f.errorType === "processing")
  const validationErrorFiles = files.filter(f => f.status === "error" && f.errorType === "validation")
  const otherFiles = files.filter(f => f.status !== "error")
  const uploadingFiles = files.filter(f => f.status === "uploading")
  const successFiles = files.filter(f => f.status === "success")
  const isUploading = uploadingFiles.length > 0
  const completedCount = successFiles.length
  const totalCount = files.length
  const hasErrors = validationErrorFiles.length > 0 || processingErrorFiles.length > 0

  const handleDismiss = () => {
    setMounted(false)
    setTimeout(() => onClose?.(), 500)
  }

  const handleDeleteWithAnimation = (id: string) => {
    if (animationTimeoutsRef.current[id]) {
      animationTimeoutsRef.current[id].forEach(t => clearTimeout(t))
    }
    animationTimeoutsRef.current[id] = []

    setAnimatingFiles(prev => ({ ...prev, [id]: { sliding: true, collapsing: false } }))

    const collapseTimeout = setTimeout(() => {
      setAnimatingFiles(prev => ({ ...prev, [id]: { sliding: true, collapsing: true } }))
      const removeTimeout = setTimeout(() => {
        onDelete(id)
        setAnimatingFiles(prev => { const n = { ...prev }; delete n[id]; return n })
      }, 200)
      animationTimeoutsRef.current[id].push(removeTimeout)
    }, 300)
    animationTimeoutsRef.current[id].push(collapseTimeout)
  }

  const handleDeleteAllProcessingErrors = () => {
    processingErrorFiles.forEach(file => handleDeleteWithAnimation(file.id))
  }

  const getFileRowClasses = (fileId: string) => {
    const a = animatingFiles[fileId]
    if (!a) return "transform translate-x-0 opacity-100 max-h-[100px]"
    let c = "overflow-hidden transition-all duration-300 ease-in-out "
    c += a.sliding ? "transform translate-x-full opacity-0 " : "transform translate-x-0 opacity-100 "
    c += a.collapsing ? "max-h-0 py-0 my-0 " : "max-h-[100px] "
    return c
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      className={`fixed bottom-4 right-4 w-[400px] bg-bg-base rounded-xl shadow-lg border border-border-base transition-all duration-500 ease-out z-[100]
        ${mounted ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0"}`}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: isMinimized ? "none" : "1px solid var(--border-base)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center">
            {isUploading && <SpinnerIcon size={20} className="text-fg-base" />}
            {!isUploading && hasErrors && <BigErrorAlertIcon size={20} />}
            {!isUploading && !hasErrors && successFiles.length > 0 && <BigSuccessCheckIcon size={20} />}
          </div>
          <div>
            <h2 className="text-sm font-medium text-fg-base">
              {isUploading && "Uploading and processing"}
              {!isUploading && hasErrors && "Some uploads failed"}
              {!isUploading && !hasErrors && successFiles.length > 0 && "Upload successful"}
              {!isUploading && !hasErrors && successFiles.length === 0 && "Uploads"}
            </h2>
            {isUploading && (
              <p className="text-xs text-fg-muted">{completedCount}/{totalCount} files</p>
            )}
            {!isUploading && hasErrors && (
              <p className="text-xs text-fg-muted">
                {validationErrorFiles.length + processingErrorFiles.length} file{validationErrorFiles.length + processingErrorFiles.length === 1 ? "" : "s"} failed
              </p>
            )}
            {!isUploading && !hasErrors && successFiles.length > 0 && (
              <p className="text-xs text-fg-muted">All files uploaded successfully</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <button onClick={() => setIsMinimized(prev => !prev)} className="text-fg-muted hover:text-fg-base transition-colors p-1 mr-1">
            {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button onClick={handleDismiss} className="text-fg-muted hover:text-fg-base transition-colors p-1">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={`overflow-x-hidden transition-all duration-300 ease-in-out ${isMinimized ? "max-h-0 opacity-0 pointer-events-none overflow-hidden" : "max-h-[400px] opacity-100 overflow-y-auto"}`}>
        {processingErrorFiles.length > 0 && (
          <div>
            <h3 className="text-xs font-medium py-2 px-4 min-h-[40px] flex items-center justify-between bg-bg-subtle text-fg-muted sticky top-0 z-10 border-b border-border-base">
              <span>Process failures</span>
              {processingErrorFiles.length > 1 && (
                <button onClick={handleDeleteAllProcessingErrors} className="text-xs text-fg-muted border border-border-base hover:bg-bg-subtle-hover rounded-md transition-colors px-2 py-1">
                  Delete all
                </button>
              )}
            </h3>
            <div className="overflow-x-hidden">
              {processingErrorFiles.map(file => (
                <div key={file.id} className={`flex items-center gap-3 px-4 py-3 group hover:bg-bg-subtle ${getFileRowClasses(file.id)}`}>
                  <div className="flex items-center justify-center flex-shrink-0 min-w-[28px]"><SomethingWrongIcon size={28} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium text-fg-base">{file.name}</p>
                    <p className="text-xs text-fg-muted">{file.errorMessage}</p>
                  </div>
                  <button onClick={() => handleDeleteWithAnimation(file.id)} className="text-fg-muted hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {validationErrorFiles.length > 0 && (
          <div className={processingErrorFiles.length > 0 ? "border-t border-border-base" : ""}>
            <h3 className="text-xs font-medium py-2 px-4 min-h-[40px] flex items-center bg-bg-subtle text-fg-muted sticky top-0 z-10 border-b border-border-base">
              Incompatible file type or size
            </h3>
            <div className="overflow-x-hidden">
              {validationErrorFiles.map(file => (
                <div key={file.id} className={`flex items-center gap-3 px-4 py-3 group hover:bg-bg-subtle ${getFileRowClasses(file.id)}`}>
                  <div className="flex items-center justify-center flex-shrink-0 min-w-[28px]"><SomethingWrongIcon size={28} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium text-fg-base">{file.name}</p>
                    <p className="text-xs text-fg-muted">{file.errorMessage}</p>
                  </div>
                  <button onClick={() => handleDeleteWithAnimation(file.id)} className="text-fg-muted hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherFiles.length > 0 && (
          <div className={hasErrors ? "border-t border-border-base" : ""}>
            <h3 className="text-xs font-medium py-2 px-4 min-h-[40px] flex items-center bg-bg-subtle text-fg-muted sticky top-0 z-10 border-b border-border-base">
              All files
            </h3>
            <div className="overflow-x-hidden">
              {otherFiles.map(file => (
                <div key={file.id} className={`flex items-center gap-3 px-4 py-3 group hover:bg-bg-subtle ${getFileRowClasses(file.id)}`}>
                  <div className="flex items-center justify-center flex-shrink-0 min-w-[28px]">
                    {file.status === "uploading" ? <UploadingIcon size={28} /> : <SuccessIcon size={28} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate font-medium ${file.status === "uploading" ? "text-fg-muted" : "text-fg-base"}`}>{file.name}</p>
                    <p className="text-xs text-fg-muted">{file.status === "uploading" ? "Uploading and processing" : "Upload complete"}</p>
                  </div>
                  {file.status === "success" && (
                    <button onClick={() => handleDeleteWithAnimation(file.id)} className="text-fg-muted hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
