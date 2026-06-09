import * as XLSX from "xlsx"

export interface SupplierImportData {
  name: string
  cnpj: string
  category: string
  email: string
  contactPhone: string
  address: string
  city: string
  state: string
  zipCode: string
  rating?: number
  active?: boolean
  contactPerson?: string
  website?: string
  notes?: string
}

export interface ParseResult {
  data: SupplierImportData[]
  errors: string[]
  warnings: string[]
}

// Mapeamento de colunas possíveis (case-insensitive)
const COLUMN_MAPPINGS: Record<string, string[]> = {
  name: ["nome", "name", "razao social", "razão social", "empresa", "fornecedor"],
  cnpj: ["cnpj", "documento", "doc", "cpf/cnpj"],
  category: ["categoria", "category", "tipo", "segmento", "ramo"],
  email: ["email", "e-mail", "mail", "contato email"],
  contactPhone: ["telefone", "phone", "tel", "celular", "contato", "fone"],
  address: ["endereco", "endereço", "address", "rua", "logradouro"],
  city: ["cidade", "city", "municipio", "município"],
  state: ["estado", "state", "uf", "sigla estado"],
  zipCode: ["cep", "zip", "zipcode", "codigo postal", "código postal"],
  rating: ["avaliacao", "avaliação", "rating", "nota", "estrelas"],
  active: ["ativo", "active", "status", "situacao", "situação"],
  contactPerson: ["contato", "pessoa contato", "responsavel", "responsável", "contact person"],
  website: ["website", "site", "web", "url", "homepage"],
  notes: ["observacoes", "observações", "notes", "obs", "notas", "comentarios", "comentários"],
}

// Função para normalizar nome de coluna
function normalizeColumnName(column: string): string | null {
  const normalized = column.toLowerCase().trim()

  for (const [key, variations] of Object.entries(COLUMN_MAPPINGS)) {
    if (variations.includes(normalized)) {
      return key
    }
  }

  return null
}

// Função para validar e normalizar CNPJ ou CPF
function normalizeDocument(value: any): string {
  if (!value) return ""

  const doc = String(value).replace(/\D/g, "")

  // Formato CNPJ (14 dígitos)
  if (doc.length === 14) {
    return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  } 
  // Formato CPF (11 dígitos)
  else if (doc.length === 11) {
    return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
  }

  return doc
}

// Função para normalizar telefone
function normalizePhone(value: any): string {
  if (!value) return ""

  const phone = String(value).replace(/\D/g, "")

  if (phone.length === 11) {
    return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
  } else if (phone.length === 10) {
    return phone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3")
  }

  return phone
}

// Função para normalizar CEP
function normalizeZipCode(value: any): string {
  if (!value) return ""

  const cep = String(value).replace(/\D/g, "")

  if (cep.length === 8) {
    return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")
  }

  return cep
}

// Função para normalizar avaliação
function normalizeRating(value: any): number {
  if (!value) return 0

  const rating = Number(value)

  if (isNaN(rating)) return 0
  if (rating < 0) return 0
  if (rating > 5) return 5

  return rating
}

// Função para normalizar status ativo
function normalizeActive(value: any): boolean {
  if (typeof value === "boolean") return value

  const normalized = String(value).toLowerCase().trim()

  return ["sim", "yes", "true", "1", "ativo", "active"].includes(normalized)
}

// Parser para CSV
export function parseCSV(content: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const data: SupplierImportData[] = []

  try {
    const lines = content.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      errors.push("Arquivo CSV vazio ou sem dados")
      return { data, errors, warnings }
    }

    // Detectar delimitador
    const firstLine = lines[0]
    const delimiter = firstLine.includes(";") ? ";" : ","

    // Parsear cabeçalho
    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/['"]/g, ""))
    const columnMap = new Map<number, string>()

    headers.forEach((header, index) => {
      const normalizedName = normalizeColumnName(header)
      if (normalizedName) {
        columnMap.set(index, normalizedName)
      }
    })

    // Validar colunas obrigatórias
    const requiredFields = ["name", "cnpj", "category"]
    const missingFields = requiredFields.filter((field) => !Array.from(columnMap.values()).includes(field))

    if (missingFields.length > 0) {
      errors.push(`Colunas obrigatórias ausentes: ${missingFields.join(", ")}`)
      return { data, errors, warnings }
    }

    // Parsear dados
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""))
      const supplier: any = {}

      columnMap.forEach((fieldName, index) => {
        const value = values[index]

        switch (fieldName) {
          case "cnpj":
            supplier[fieldName] = normalizeDocument(value)
            break
          case "contactPhone":
            supplier[fieldName] = normalizePhone(value)
            break
          case "zipCode":
            supplier[fieldName] = normalizeZipCode(value)
            break
          case "rating":
            supplier[fieldName] = normalizeRating(value)
            break
          case "active":
            supplier[fieldName] = normalizeActive(value)
            break
          default:
            supplier[fieldName] = value || ""
        }
      })

      // Validar campos obrigatórios
      if (!supplier.name || !supplier.cnpj || !supplier.category) {
        warnings.push(`Linha ${i + 1}: Dados incompletos (nome, CNPJ ou categoria ausente)`)
        continue
      }

      // Definir valores padrão
      if (supplier.active === undefined) supplier.active = true
      if (supplier.rating === undefined) supplier.rating = 0

      data.push(supplier as SupplierImportData)
    }

    if (data.length === 0 && errors.length === 0) {
      warnings.push("Nenhum fornecedor válido encontrado no arquivo")
    }
  } catch (error) {
    errors.push(`Erro ao processar CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
  }

  return { data, errors, warnings }
}

// Parser para Excel
export function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const errors: string[] = []
    const warnings: string[] = []
    const data: SupplierImportData[] = []

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const workbook = XLSX.read(arrayBuffer, { type: "array" })

        if (workbook.SheetNames.length === 0) {
          errors.push("Arquivo Excel não contém planilhas")
          resolve({ data, errors, warnings })
          return
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]

        if (jsonData.length < 2) {
          errors.push("Planilha vazia ou sem dados")
          resolve({ data, errors, warnings })
          return
        }

        // Parsear cabeçalho
        const headers = jsonData[0].map((h: any) => String(h || "").trim())
        const columnMap = new Map<number, string>()

        headers.forEach((header, index) => {
          const normalizedName = normalizeColumnName(header)
          if (normalizedName) {
            columnMap.set(index, normalizedName)
          }
        })

        // Validar colunas obrigatórias
        const requiredFields = ["name", "cnpj", "category"]
        const missingFields = requiredFields.filter((field) => !Array.from(columnMap.values()).includes(field))

        if (missingFields.length > 0) {
          errors.push(`Colunas obrigatórias ausentes: ${missingFields.join(", ")}`)
          resolve({ data, errors, warnings })
          return
        }

        // Parsear dados
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue

          const supplier: any = {}

          columnMap.forEach((fieldName, index) => {
            const value = row[index]

            switch (fieldName) {
              case "cnpj":
                supplier[fieldName] = normalizeDocument(value)
                break
              case "contactPhone":
                supplier[fieldName] = normalizePhone(value)
                break
              case "zipCode":
                supplier[fieldName] = normalizeZipCode(value)
                break
              case "rating":
                supplier[fieldName] = normalizeRating(value)
                break
              case "active":
                supplier[fieldName] = normalizeActive(value)
                break
              default:
                supplier[fieldName] = value ? String(value).trim() : ""
            }
          })

          // Validar campos obrigatórios
          if (!supplier.name || !supplier.cnpj || !supplier.category) {
            warnings.push(`Linha ${i + 1}: Dados incompletos (nome, CNPJ ou categoria ausente)`)
            continue
          }

          // Definir valores padrão
          if (supplier.active === undefined) supplier.active = true
          if (supplier.rating === undefined) supplier.rating = 0

          data.push(supplier as SupplierImportData)
        }

        if (data.length === 0 && errors.length === 0) {
          warnings.push("Nenhum fornecedor válido encontrado no arquivo")
        }
      } catch (error) {
        errors.push(`Erro ao processar Excel: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      }

      resolve({ data, errors, warnings })
    }

    reader.onerror = () => {
      errors.push("Erro ao ler arquivo Excel")
      resolve({ data, errors, warnings })
    }

    reader.readAsArrayBuffer(file)
  })
}

// Parser para JSON
export function parseJSON(content: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const data: SupplierImportData[] = []

  try {
    const jsonData = JSON.parse(content)

    if (!Array.isArray(jsonData)) {
      errors.push("JSON deve ser um array de fornecedores")
      return { data, errors, warnings }
    }

    if (jsonData.length === 0) {
      warnings.push("Array JSON vazio")
      return { data, errors, warnings }
    }

    jsonData.forEach((item, index) => {
      if (typeof item !== "object" || item === null) {
        warnings.push(`Item ${index + 1}: Formato inválido`)
        return
      }

      // Mapear campos
      const supplier: any = {}

      Object.entries(item).forEach(([key, value]) => {
        const normalizedKey = normalizeColumnName(key)
        if (normalizedKey) {
          switch (normalizedKey) {
            case "cnpj":
              supplier[normalizedKey] = normalizeDocument(value)
              break
            case "contactPhone":
              supplier[normalizedKey] = normalizePhone(value)
              break
            case "zipCode":
              supplier[normalizedKey] = normalizeZipCode(value)
              break
            case "rating":
              supplier[normalizedKey] = normalizeRating(value)
              break
            case "active":
              supplier[normalizedKey] = normalizeActive(value)
              break
            default:
              supplier[normalizedKey] = value ? String(value).trim() : ""
          }
        }
      })

      // Validar campos obrigatórios
      if (!supplier.name || !supplier.cnpj || !supplier.category) {
        warnings.push(`Item ${index + 1}: Dados incompletos (nome, CNPJ ou categoria ausente)`)
        return
      }

      // Definir valores padrão
      if (supplier.active === undefined) supplier.active = true
      if (supplier.rating === undefined) supplier.rating = 0

      data.push(supplier as SupplierImportData)
    })

    if (data.length === 0 && errors.length === 0) {
      warnings.push("Nenhum fornecedor válido encontrado no JSON")
    }
  } catch (error) {
    errors.push(`Erro ao processar JSON: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
  }

  return { data, errors, warnings }
}

// Função principal de parsing
export async function parseSupplierFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension === "csv") {
    const content = await file.text()
    return parseCSV(content)
  } else if (extension === "xlsx" || extension === "xls") {
    return parseExcel(file)
  } else if (extension === "json") {
    const content = await file.text()
    return parseJSON(content)
  } else {
    return {
      data: [],
      errors: ["Formato de arquivo não suportado. Use CSV, Excel ou JSON"],
      warnings: [],
    }
  }
}
