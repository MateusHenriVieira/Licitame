"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"

interface FileUploadProps {
  accept?: string
  maxSize?: number // em MB
  multiple?: boolean
  onUpload?: (file: File | File[]) => void
  onFileChange?: (file: File | File[]) => void
  disabled?: boolean
}

export function FileUpload({
  accept = "*",
  maxSize = 10,
  multiple = false,
  onUpload,
  onFileChange,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use onFileChange se onUpload não estiver disponível
  const handleFileCallback = onUpload || onFileChange

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const validateFiles = (fileList: FileList | File[]) => {
    const validFiles: File[] = []
    let hasError = false

    Array.from(fileList).forEach((file) => {
      // Verificar tamanho
      if (file.size > maxSize * 1024 * 1024) {
        setError(`O arquivo ${file.name} excede o tamanho máximo de ${maxSize}MB.`)
        hasError = true
        return
      }

      // Verificar tipo
      if (accept !== "*") {
        const acceptedTypes = accept.split(",").map((type) => type.trim())
        const fileType = file.type
        const fileExtension = `.${file.name.split(".").pop()}`

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return fileExtension.toLowerCase() === type.toLowerCase()
          }
          if (type.endsWith("/*")) {
            const mainType = type.split("/")[0]
            return fileType.startsWith(`${mainType}/`)
          }
          return fileType === type
        })

        if (!isAccepted) {
          setError(`O arquivo ${file.name} não é um tipo aceito. Tipos aceitos: ${accept}`)
          hasError = true
          return
        }
      }

      validFiles.push(file)
    })

    if (!hasError) {
      setError(null)
    }

    return validFiles
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    handleFiles(droppedFiles)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList: FileList) => {
    const validFiles = validateFiles(fileList)

    if (validFiles.length > 0) {
      if (!multiple) {
        setFiles([validFiles[0]])
      } else {
        setFiles((prev) => [...prev, ...validFiles])
      }

      simulateUpload(validFiles)
    }
  }

  const simulateUpload = (filesToUpload: File[]) => {
    setIsUploading(true)
    setProgress(0)
    setIsComplete(false)

    // Simulação de upload com progresso
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 5
      setProgress(currentProgress)

      if (currentProgress >= 100) {
        clearInterval(interval)
        setIsUploading(false)
        setIsComplete(true)

        // Chamar o callback se existir
        if (handleFileCallback) {
          if (multiple) {
            handleFileCallback(filesToUpload)
          } else {
            handleFileCallback(filesToUpload[0])
          }
        }
      }
    }, 100)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    if (files.length === 1) {
      setIsComplete(false)
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={disabled ? undefined : handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center py-4">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">Arraste e solte arquivos aqui ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground">
            {multiple ? "Arquivos" : "Arquivo"} {accept !== "*" ? accept : ""} (Máx. {maxSize}MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}

      {isUploading && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Enviando...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md text-sm">
              <div className="flex items-center">
                <File className="h-4 w-4 mr-2" />
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <div className="flex items-center">
                {isComplete && <CheckCircle className="h-4 w-4 text-green-500 mr-2" />}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
