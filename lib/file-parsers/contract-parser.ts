import type { Contract, ContractItem } from "@/lib/contracts-provider"
import type { Supplier } from "@/lib/suppliers-provider"
import * as XLSX from "xlsx"
import mammoth from "mammoth"

export type ParsedContract = Omit<Contract, "id" | "usedValue" | "usedPercentage">

export interface ParseResult {
  success: boolean
  data: ParsedContract[]
  suppliers: Omit<Supplier, "id" | "createdAt" | "updatedAt">[]
  supplierMapping: Map<string, string>
  errors: string[]
  warnings: string[]
  driveLink?: string
  extractedContent?: string
}

/**
 * Mapeamento de possíveis nomes de colunas para campos do contrato
 */
const FIELD_MAPPINGS: Record<string, string[]> = {
  number: ["numero", "number", "contrato", "contract", "num_contrato", "contract_number"],
  company: ["empresa", "company", "fornecedor", "supplier", "nome_empresa"],
  value: ["valor", "value", "valor_total", "total_value", "amount"],
  expirationDate: ["vencimento", "expiration_date", "data_vencimento", "expiry_date", "validade", "fim_contrato"],
  startDate: ["inicio", "start_date", "data_inicio", "start", "vigencia"],
  costBase: ["base_custo", "cost_base", "base", "centro_custo", "cost_center"],
  description: ["descricao", "description", "desc", "detalhes", "details"],
  status: ["status", "estado", "state", "situacao"],
  // Campos do fornecedor
  cnpj: ["cnpj", "cpf_cnpj", "documento"],
  address: ["endereco", "address", "rua", "street"],
  city: ["cidade", "city"],
  state: ["estado", "state", "uf"],
  zipCode: ["cep", "zip_code", "postal_code"],
  contactName: ["responsavel", "contact_name", "contato", "contact"],
  contactPhone: ["telefone", "phone", "contact_phone", "fone"],
  email: ["email", "e_mail", "mail"],
  website: ["website", "site", "web"],
  category: ["categoria", "category", "tipo", "type"],
}

/**
 * Normaliza o nome de uma coluna
 */
function normalizeFieldName(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_")
}

/**
 * Mapeia o nome da coluna para o campo correto do contrato
 */
function mapFieldName(columnName: string): string | null {
  const normalized = normalizeFieldName(columnName)

  for (const [field, variants] of Object.entries(FIELD_MAPPINGS)) {
    if (variants.some((variant) => normalized.includes(variant) || variant.includes(normalized))) {
      return field
    }
  }

  return null
}

/**
 * Converte valor para número
 */
function parseNumber(value: any): number {
  if (typeof value === "number") return value

  if (typeof value === "string") {
    const cleaned = value
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
    const parsed = Number.parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  return 0
}

/**
 * Converte valor para data ISO
 */
function parseDate(value: any): string {
  if (!value) return new Date().toISOString().split("T")[0]

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.split("T")[0]
  }

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value)
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`
  }

  if (typeof value === "string") {
    if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
      const [day, month, year] = value.split("/")
      return `${year}-${month}-${day}`
    }

    if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0]
      }
    }
  }

  return new Date().toISOString().split("T")[0]
}

/**
 * Valida e normaliza o status
 */
function parseStatus(value: any): "ativo" | "expirado" | "vencido" | "cancelado" {
  if (!value) return "ativo"

  const normalized = String(value).toLowerCase().trim()

  if (normalized.includes("ativo") || normalized.includes("active")) return "ativo"
  if (normalized.includes("vencido")) return "vencido"
  if (normalized.includes("expirado") || normalized.includes("expired")) return "expirado"
  if (normalized.includes("cancelado") || normalized.includes("cancelled")) return "cancelado"

  return "ativo"
}

/**
 * Verifica se há dados suficientes para criar um fornecedor
 */
function hasSupplierData(data: any): boolean {
  const requiredFields = ["company", "cnpj", "category"]
  return requiredFields.every((field) => data[field] && String(data[field]).trim())
}

/**
 * Parse CSV
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    data: [],
    suppliers: [],
    supplierMapping: new Map(),
    errors: [],
    warnings: [],
  }

  try {
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      result.errors.push("O arquivo CSV está vazio ou não possui dados suficientes")
      return result
    }

    const delimiter = lines[0].includes(";") ? ";" : ","
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/['"]/g, ""))
    const mappedHeaders = headers.map((h) => mapFieldName(h))

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(delimiter).map((v) => v.trim().replace(/['"]/g, ""))
      const contract: any = {}

      headers.forEach((header, index) => {
        const field = mappedHeaders[index]
        if (field) {
          contract[field] = values[index]
        }
      })

      try {
        const { parsedContract, supplier, supplierId } = normalizeContract(contract, i + 1, result)
        if (parsedContract) {
          result.data.push(parsedContract)
          if (supplier && supplierId) {
            const existing = result.suppliers.find((s) => s.cnpj === supplier.cnpj)
            if (!existing) {
              result.suppliers.push(supplier)
            }
            result.supplierMapping.set(parsedContract.number, supplierId)
          }
        }
      } catch (error) {
        result.errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      }
    }

    result.success = result.data.length > 0
    return result
  } catch (error) {
    result.errors.push(`Erro ao processar CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    return result
  }
}

/**
 * Parse Excel
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    data: [],
    suppliers: [],
    supplierMapping: new Map(),
    errors: [],
    warnings: [],
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

    if (jsonData.length === 0) {
      result.errors.push("A planilha está vazia")
      return result
    }

    jsonData.forEach((row: any, index) => {
      const contract: any = {}

      Object.keys(row).forEach((key) => {
        const field = mapFieldName(key)
        if (field) {
          contract[field] = row[key]
        }
      })

      try {
        const { parsedContract, supplier, supplierId } = normalizeContract(contract, index + 2, result)
        if (parsedContract) {
          result.data.push(parsedContract)
          if (supplier && supplierId) {
            const existing = result.suppliers.find((s) => s.cnpj === supplier.cnpj)
            if (!existing) {
              result.suppliers.push(supplier)
            }
            result.supplierMapping.set(parsedContract.number, supplierId)
          }
        }
      } catch (error) {
        result.errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      }
    })

    result.success = result.data.length > 0
    return result
  } catch (error) {
    result.errors.push(`Erro ao processar Excel: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    return result
  }
}

/**
 * Parse JSON
 */
export async function parseJSON(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    data: [],
    suppliers: [],
    supplierMapping: new Map(),
    errors: [],
    warnings: [],
  }

  try {
    const text = await file.text()
    const jsonData = JSON.parse(text)

    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]

    if (dataArray.length === 0) {
      result.errors.push("O arquivo JSON está vazio")
      return result
    }

    dataArray.forEach((item, index) => {
      try {
        const { parsedContract, supplier, supplierId } = normalizeContract(item, index + 1, result)
        if (parsedContract) {
          result.data.push(parsedContract)
          if (supplier && supplierId) {
            const existing = result.suppliers.find((s) => s.cnpj === supplier.cnpj)
            if (!existing) {
              result.suppliers.push(supplier)
            }
            result.supplierMapping.set(parsedContract.number, supplierId)
          }
        }
      } catch (error) {
        result.errors.push(`Item ${index + 1}: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      }
    })

    result.success = result.data.length > 0
    return result
  } catch (error) {
    result.errors.push(`Erro ao processar JSON: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    return result
  }
}

/**
 * Normaliza e valida um contrato
 */
function normalizeContract(
  data: any,
  lineNumber: number,
  result: ParseResult,
): {
  parsedContract: ParsedContract | null
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt"> | null
  supplierId: string | null
} {
  const required = ["number", "company", "value", "expirationDate", "startDate", "costBase", "description"]
  const missing = required.filter((field) => !data[field])

  if (missing.length > 0) {
    result.warnings.push(`Linha ${lineNumber}: Campos obrigatórios faltando: ${missing.join(", ")}`)
    return { parsedContract: null, supplier: null, supplierId: null }
  }

  let supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt"> | null = null
  let supplierId: string | null = null

  // Verificar se há dados suficientes para criar um fornecedor
  if (hasSupplierData(data)) {
    supplierId = `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    supplier = {
      name: String(data.company || "").trim(),
      cnpj: String(data.cnpj || "").trim(),
      address: String(data.address || "").trim(),
      city: String(data.city || "").trim(),
      state: String(data.state || "").trim(),
      zipCode: String(data.zipCode || "").trim(),
      contactName: String(data.contactName || "").trim(),
      contactPhone: String(data.contactPhone || "").trim(),
      email: String(data.email || "").trim(),
      website: String(data.website || "").trim(),
      category: String(data.category || "").trim(),
      rating: 0,
      active: true,
      productIds: [],
      contractIds: [],
    }
  }

  // Parse items se existirem
  let items: ContractItem[] = []
  if (data.items && Array.isArray(data.items)) {
    items = data.items.map((item: any, index: number) => ({
      id: `item_${Date.now()}_${index}`,
      name: item.name || item.nome || "",
      description: item.description || item.descricao || "",
      quantity: parseNumber(item.quantity || item.quantidade || 0),
      unitPrice: parseNumber(item.unitPrice || item.preco_unitario || item.valor_unitario || 0),
      totalPrice: parseNumber(item.totalPrice || item.preco_total || item.valor_total || 0),
      usedQuantity: 0,
    }))
  }

  const contract: ParsedContract = {
    number: String(data.number || "").trim(),
    company: String(data.company || "").trim(),
    value: parseNumber(data.value),
    expirationDate: parseDate(data.expirationDate),
    startDate: parseDate(data.startDate),
    costBase: String(data.costBase || "").trim(),
    description: String(data.description || "").trim(),
    status: parseStatus(data.status),
    items,
    supplierId: supplierId || data.supplierId || undefined,
    productIds: data.productIds || undefined,
  }

  // Verificar se o contrato está vencido
  const parsedStatus = parseStatus(data.status)
  if (parsedStatus === "ativo") {
    const expirationDate = new Date(parseDate(data.expirationDate))
    const now = new Date()
    if (expirationDate <= now) {
      contract.status = "vencido"
    }
  }

  return { parsedContract: contract, supplier, supplierId }
}

/**
 * Parse Word Document (.docx)
 * Extrai dados de contratos de documentos Word baseado no formato padrão de contratos
 */
export async function parseWord(file: File, driveLink?: string): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    data: [],
    suppliers: [],
    supplierMapping: new Map(),
    errors: [],
    warnings: [],
    driveLink,
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const { value: text } = await mammoth.extractRawText({ arrayBuffer })

    // Extract contract data from Word document
    const contractData = extractContractDataFromText(text)

    if (!contractData) {
      result.errors.push("Não foi possível extrair dados do contrato. Verifique se o documento segue o formato padrão.")
      return result
    }

    const { parsedContract, supplier, supplierId } = normalizeContractFromWord(contractData, 1, result)
    
    if (parsedContract) {
      // Add drive link to contract
      parsedContract.driveLink = driveLink
      result.data.push(parsedContract)
      
      if (supplier && supplierId) {
        result.suppliers.push(supplier)
        result.supplierMapping.set(parsedContract.number, supplierId)
      }
    }

    result.success = result.data.length > 0
    return result
  } catch (error) {
    result.errors.push(`Erro ao processar Word: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    return result
  }
}

/**
 * Extrai dados do contrato do texto do documento Word
 */
function extractContractDataFromText(text: string): Record<string, any> | null {
  const data: Record<string, any> = {}

  // Extract contract number (e.g., "CONTRATO DE Nº 074/2025" or "CONTRATO N° 074 - 2024")
  const contractNumberMatch = text.match(/CONTRATO\s*(?:DE\s*)?N[°º]?\s*(\d+[\/-]?\d*)/i)
  if (contractNumberMatch) {
    data.number = contractNumberMatch[1].trim()
  }

  // Extract process number
  const processMatch = text.match(/PROCESSO\s*ADMINISTRATIVO\s*N[°º]?\s*(\d+[\/-]?\d*)/i)
  if (processMatch) {
    data.processNumber = processMatch[1].trim()
  }

  // Extract modality (Pregão)
  const modalityMatch = text.match(/PREGÃO\s*(?:ELETRÔNIC[OA]|PRESENCIAL)?\s*N[°º]?\s*(\d+[\/-]?\d*)/i)
  if (modalityMatch) {
    data.modality = `Pregão Eletrônico ${modalityMatch[1]}`
  }

  // Extract contractor (CONTRATANTE) - Municipality/Entity
  const contractorMatch = text.match(/(?:MUNICÍPIO|PREFEITURA|SECRETARIA)\s*(?:DE\s*|MUNICIPAL\s*DE\s*)([^,\n]+)/i)
  if (contractorMatch) {
    data.contractor = contractorMatch[1].trim()
  }

  // Extract contractor CNPJ
  const contractorCNPJMatch = text.match(/(?:CONTRATANTE|MUNICÍPIO|PREFEITURA)[^]*?CNPJ[^]*?(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i)
  if (contractorCNPJMatch) {
    data.contractorCNPJ = contractorCNPJMatch[1]
  }

  // Extract company (CONTRATADA) - Supplier
  const companyMatch = text.match(/(?:CONTRATADA|empresa)\s*([A-ZÀ-ÚÇ\s]+(?:LTDA|ME|EPP|EIRELI|S\.?A\.?)?)/i)
  if (companyMatch) {
    data.company = companyMatch[1].trim().replace(/\s+/g, " ")
  }

  // Extract company CNPJ
  const companyCNPJMatch = text.match(/(?:CONTRATADA|empresa)[^]*?CNPJ[:\s]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i)
  if (companyCNPJMatch) {
    data.cnpj = companyCNPJMatch[1]
  }

  // Extract company address
  const addressMatch = text.match(/(?:sede|endereço|localizada)\s*(?:a|à|na|no)?\s*([^,]+,[^,]+)/i)
  if (addressMatch) {
    data.address = addressMatch[1].trim()
  }

  // Extract object/description
  const objectMatch = text.match(/CLÁUSULA\s*SEGUNDA\s*[–-]\s*OBJETO[^]*?(?:2\.1\.?)\s*([^]*?)(?:ITEM|CLÁUSULA\s*TERCEIRA|3\.)/i)
  if (objectMatch) {
    data.description = objectMatch[1]
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 500)
  }

  // Extract total value
  const totalValueMatch = text.match(/(?:VALOR\s*(?:GLOBAL|TOTAL)|valor\s*de)\s*(?:de\s*)?R?\$?\s*([\d.,]+)/i)
  if (totalValueMatch) {
    data.value = parseNumber(totalValueMatch[1])
  }

  // If no total value found, try to sum items
  if (!data.value || data.value === 0) {
    const itemValues = text.match(/R\$\s*([\d.,]+)/g)
    if (itemValues && itemValues.length > 0) {
      // Get the largest value as likely total
      const values = itemValues.map(v => parseNumber(v.replace("R$", "").trim()))
      data.value = Math.max(...values)
    }
  }

  // Extract validity period
  const validityMatch = text.match(/(?:vigência|validade|prazo)[^]*?(\d{1,2})\s*(?:meses?|dias?|anos?)/i)
  if (validityMatch) {
    data.validityPeriod = validityMatch[1]
  }

  // Extract start date
  const startDateMatch = text.match(/(?:início|assinatura|firmado)[^]*?(\d{1,2})\s*(?:de\s*)?(\w+)\s*(?:de\s*)?(\d{4})/i)
  if (startDateMatch) {
    data.startDate = parsePortugueseDate(startDateMatch[1], startDateMatch[2], startDateMatch[3])
  }

  // Extract expiration date or calculate from start + validity
  const expirationMatch = text.match(/(?:término|vencimento|fim)[^]*?(\d{1,2})\s*(?:de\s*)?(\w+)\s*(?:de\s*)?(\d{4})/i)
  if (expirationMatch) {
    data.expirationDate = parsePortugueseDate(expirationMatch[1], expirationMatch[2], expirationMatch[3])
  }

  // Extract cost base / department
  const costBaseMatch = text.match(/(?:SECRETARIA\s*MUNICIPAL\s*DE|SETOR|DEPARTAMENTO)\s*([A-ZÀ-ÚÇ\s]+)/i)
  if (costBaseMatch) {
    data.costBase = costBaseMatch[1].trim()
  }

  // Extract items from table
  data.items = extractItemsFromText(text)

  // Set defaults if not found
  if (!data.startDate) {
    data.startDate = new Date().toISOString().split("T")[0]
  }
  if (!data.expirationDate) {
    // Default to 12 months from start
    const start = new Date(data.startDate)
    start.setFullYear(start.getFullYear() + 1)
    data.expirationDate = start.toISOString().split("T")[0]
  }
  if (!data.costBase) {
    data.costBase = "Geral"
  }
  if (!data.description) {
    data.description = "Contrato importado de documento Word"
  }

  // Validate minimum required fields
  if (!data.number && !data.company) {
    return null
  }

  return data
}

/**
 * Extract items from contract table in text
 */
function extractItemsFromText(text: string): ContractItem[] {
  const items: ContractItem[] = []
  
  // Pattern to match table rows with item data
  // Looking for: ITEM NUMBER, DESCRIPTION, UNIT, BRAND, UNIT_PRICE, QUANTITY, TOTAL
  const itemPattern = /(\d+)\s+([A-ZÀ-ÚÇ][A-ZÀ-ÚÇa-zà-úç\s\-\/°,\.()]+?)\s+(UD|UN|CX|PCT|KG|LT|MT|M2|M3|PC|PAR|ROLO|RESMA)\s+([A-ZÀ-ÚÇa-zà-úç\s]+?)\s+([\d,\.]+)\s+(\d+)\s+R?\$?\s*([\d.,]+)/g

  let match
  let itemIndex = 0
  while ((match = itemPattern.exec(text)) !== null) {
    const [, itemNum, description, unit, brand, unitPrice, quantity, totalPrice] = match
    
    items.push({
      id: `item_${Date.now()}_${itemIndex}`,
      name: description.trim().substring(0, 100),
      description: `${description.trim()} - Marca: ${brand.trim()}`,
      quantity: parseInt(quantity, 10),
      unitPrice: parseNumber(unitPrice),
      totalPrice: parseNumber(totalPrice),
      usedQuantity: 0,
    })
    itemIndex++
  }

  return items
}

/**
 * Parse Portuguese date (e.g., "12 de junho de 2025")
 */
function parsePortugueseDate(day: string, month: string, year: string): string {
  const months: Record<string, string> = {
    janeiro: "01",
    fevereiro: "02",
    março: "03",
    marco: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12",
  }

  const monthNum = months[month.toLowerCase()] || "01"
  return `${year}-${monthNum}-${day.padStart(2, "0")}`
}

/**
 * Normaliza contrato extraído do Word
 */
function normalizeContractFromWord(
  data: Record<string, any>,
  lineNumber: number,
  result: ParseResult,
): {
  parsedContract: ParsedContract | null
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt"> | null
  supplierId: string | null
} {
  let supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt"> | null = null
  let supplierId: string | null = null

  // Create supplier if we have company and CNPJ
  if (data.company && data.cnpj) {
    supplierId = `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    supplier = {
      name: data.company,
      cnpj: data.cnpj,
      address: data.address || "",
      city: "",
      state: "",
      zipCode: "",
      contactName: "",
      contactPhone: "",
      email: "",
      website: "",
      category: data.costBase || "Fornecedor",
      rating: 0,
      active: true,
      productIds: [],
      contractIds: [],
    }
  }

  const contract: ParsedContract = {
    number: data.number || `CONTRATO-${Date.now()}`,
    company: data.company || data.cnpj || "Empresa não identificada",
    value: data.value || 0,
    expirationDate: data.expirationDate,
    startDate: data.startDate,
    costBase: data.costBase || "Geral",
    description: data.description || "Contrato importado",
    status: "ativo",
    items: data.items || [],
    supplierId: supplierId || undefined,
    driveLink: data.driveLink,
  }

  // Verificar se o contrato está vencido
  if (data.expirationDate) {
    const expirationDate = new Date(data.expirationDate)
    const now = new Date()
    if (expirationDate <= now) {
      contract.status = "vencido"
    }
  }

  // Add warnings for missing data
  if (!data.value || data.value === 0) {
    result.warnings.push("Valor total do contrato não identificado")
  }
  if (!data.company) {
    result.warnings.push("Empresa contratada não identificada")
  }
  if (contract.items.length === 0) {
    result.warnings.push("Nenhum item do contrato foi identificado")
  }

  return { parsedContract: contract, supplier, supplierId }
}

/**
 * Função principal para detectar tipo e fazer parse
 */
export async function parseContractFile(file: File, driveLink?: string): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "csv":
      return parseCSV(file)
    case "xlsx":
    case "xls":
      return parseExcel(file)
    case "json":
      return parseJSON(file)
    case "docx":
    case "doc":
      return parseWord(file, driveLink)
    default:
      return {
        success: false,
        data: [],
        suppliers: [],
        supplierMapping: new Map(),
        errors: [`Formato de arquivo não suportado: ${extension}`],
        warnings: [],
      }
  }
}
