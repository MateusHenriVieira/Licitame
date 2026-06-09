// Schemas de validação para todos os tipos de dados do sistema

export type ValidationError = {
  field: string
  message: string
  value?: any
}

export type ValidationResult = {
  valid: boolean
  errors: ValidationError[]
}

// Validadores básicos
export const validators = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null || value === "") {
      return { field: fieldName, message: "Campo obrigatório" }
    }
    return null
  },

  string: (value: any, fieldName: string): ValidationError | null => {
    if (typeof value !== "string") {
      return { field: fieldName, message: "Deve ser um texto", value }
    }
    return null
  },

  number: (value: any, fieldName: string): ValidationError | null => {
    if (typeof value !== "number" || isNaN(value)) {
      return { field: fieldName, message: "Deve ser um número", value }
    }
    return null
  },

  boolean: (value: any, fieldName: string): ValidationError | null => {
    if (typeof value !== "boolean") {
      return { field: fieldName, message: "Deve ser verdadeiro ou falso", value }
    }
    return null
  },

  email: (value: string, fieldName: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: "Email inválido", value }
    }
    return null
  },

  cnpj: (value: string, fieldName: string): ValidationError | null => {
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    if (!cnpjRegex.test(value)) {
      return { field: fieldName, message: "CNPJ inválido (formato: 00.000.000/0000-00)", value }
    }
    return null
  },

  cpf: (value: string, fieldName: string): ValidationError | null => {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
    if (!cpfRegex.test(value)) {
      return { field: fieldName, message: "CPF inválido (formato: 000.000.000-00)", value }
    }
    return null
  },

  document: (value: string, fieldName: string): ValidationError | null => {
    // Aceita tanto CNPJ quanto CPF
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
    
    if (!cnpjRegex.test(value) && !cpfRegex.test(value)) {
      return { field: fieldName, message: "CNPJ ou CPF inválido", value }
    }
    return null
  },

  phone: (value: string, fieldName: string): ValidationError | null => {
    const phoneRegex = /^$$\d{2}$$\s?\d{4,5}-?\d{4}$/
    if (!phoneRegex.test(value)) {
      return { field: fieldName, message: "Telefone inválido (formato: (00) 00000-0000)", value }
    }
    return null
  },

  zipCode: (value: string, fieldName: string): ValidationError | null => {
    const zipRegex = /^\d{5}-?\d{3}$/
    if (!zipRegex.test(value)) {
      return { field: fieldName, message: "CEP inválido (formato: 00000-000)", value }
    }
    return null
  },

  date: (value: string, fieldName: string): ValidationError | null => {
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return { field: fieldName, message: "Data inválida", value }
    }
    return null
  },

  url: (value: string, fieldName: string): ValidationError | null => {
    try {
      new URL(value.startsWith("http") ? value : `https://${value}`)
      return null
    } catch {
      return { field: fieldName, message: "URL inválida", value }
    }
  },

  positiveNumber: (value: number, fieldName: string): ValidationError | null => {
    if (value < 0) {
      return { field: fieldName, message: "Deve ser um número positivo", value }
    }
    return null
  },

  range: (value: number, fieldName: string, min: number, max: number): ValidationError | null => {
    if (value < min || value > max) {
      return { field: fieldName, message: `Deve estar entre ${min} e ${max}`, value }
    }
    return null
  },
}

// Schema para Produto
export const productSchema = {
  id: [validators.required, validators.string],
  name: [validators.required, validators.string],
  code: [validators.required, validators.string],
  description: [validators.required, validators.string],
  category: [validators.required, validators.string],
  unit: [validators.required, validators.string],
  price: [validators.required, validators.number, validators.positiveNumber],
  stock: [validators.required, validators.number, validators.positiveNumber],
  minStock: [validators.required, validators.number, validators.positiveNumber],
  maxStock: [validators.required, validators.number, validators.positiveNumber],
  active: [validators.required, validators.boolean],
  createdAt: [validators.required, validators.string, validators.date],
  updatedAt: [validators.required, validators.string, validators.date],
}

// Schema para Fornecedor
export const supplierSchema = {
  id: [validators.required, validators.string],
  name: [validators.required, validators.string],
  cnpj: [validators.required, validators.string, validators.document],
  address: [validators.required, validators.string],
  city: [validators.required, validators.string],
  state: [validators.required, validators.string],
  zipCode: [validators.required, validators.string, validators.zipCode],
  contactName: [validators.required, validators.string],
  contactPhone: [validators.required, validators.string, validators.phone],
  email: [validators.required, validators.string, validators.email],
  website: [validators.required, validators.string],
  category: [validators.required, validators.string],
  rating: [
    validators.required,
    validators.number,
    (value: number, field: string) => validators.range(value, field, 0, 5),
  ],
  active: [validators.required, validators.boolean],
  createdAt: [validators.required, validators.string, validators.date],
  updatedAt: [validators.required, validators.string, validators.date],
}

// Schema para Item de Contrato
export const contractItemSchema = {
  id: [validators.required, validators.string],
  name: [validators.required, validators.string],
  description: [validators.required, validators.string],
  quantity: [validators.required, validators.number, validators.positiveNumber],
  unitPrice: [validators.required, validators.number, validators.positiveNumber],
  totalPrice: [validators.required, validators.number, validators.positiveNumber],
  usedQuantity: [validators.required, validators.number, validators.positiveNumber],
}

// Schema para Contrato
export const contractSchema = {
  id: [validators.required, validators.string],
  number: [validators.required, validators.string],
  company: [validators.required, validators.string],
  value: [validators.required, validators.number, validators.positiveNumber],
  usedValue: [validators.required, validators.number, validators.positiveNumber],
  usedPercentage: [
    validators.required,
    validators.number,
    (value: number, field: string) => validators.range(value, field, 0, 100),
  ],
  expirationDate: [validators.required, validators.string, validators.date],
  startDate: [validators.required, validators.string, validators.date],
  costBase: [validators.required, validators.string],
  description: [validators.required, validators.string],
  status: [validators.required, validators.string],
}

// Schema para Item de Pedido
export const orderItemSchema = {
  id: [validators.required, validators.string],
  contractItemId: [validators.required, validators.string],
  name: [validators.required, validators.string],
  quantity: [validators.required, validators.number, validators.positiveNumber],
  unitPrice: [validators.required, validators.number, validators.positiveNumber],
  totalPrice: [validators.required, validators.number, validators.positiveNumber],
}

// Schema para Pedido
export const orderSchema = {
  id: [validators.required, validators.string],
  number: [validators.required, validators.string],
  contractId: [validators.required, validators.string],
  contractNumber: [validators.required, validators.string],
  date: [validators.required, validators.string, validators.date],
  requestedBy: [validators.required, validators.string],
  requestedByDepartment: [validators.required, validators.string],
  requestedFor: [validators.required, validators.string],
  totalValue: [validators.required, validators.number, validators.positiveNumber],
  status: [validators.required, validators.string],
}

// Schema para Base de Custo
export const costBaseSchema = {
  id: [validators.required, validators.string],
  name: [validators.required, validators.string],
  company: [validators.required, validators.string],
  cnpj: [validators.required, validators.string, validators.cnpj],
  address: [validators.required, validators.string],
  city: [validators.required, validators.string],
  state: [validators.required, validators.string],
  zipCode: [validators.required, validators.string, validators.zipCode],
  contactName: [validators.required, validators.string],
  contactEmail: [validators.required, validators.string, validators.email],
  contactPhone: [validators.required, validators.string, validators.phone],
}

// Schema para Usuário
export const userSchema = {
  id: [validators.required, validators.number],
  name: [validators.required, validators.string],
  email: [validators.required, validators.string, validators.email],
  role: [validators.required, validators.string],
  status: [validators.required, validators.string],
  lastAccess: [validators.required, validators.string],
}

// Schema para Notificação
export const notificationSchema = {
  id: [validators.required, validators.string],
  title: [validators.required, validators.string],
  message: [validators.required, validators.string],
  type: [validators.required, validators.string],
  read: [validators.required, validators.boolean],
}

// Função genérica para validar um objeto
export function validateObject(obj: any, schema: any): ValidationResult {
  const errors: ValidationError[] = []

  for (const [field, validatorFns] of Object.entries(schema)) {
    const value = obj[field]

    for (const validator of validatorFns as Function[]) {
      const error = validator(value, field)
      if (error) {
        errors.push(error)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Função para validar um array de objetos
export function validateArray(
  arr: any[],
  schema: any,
): { valid: boolean; errors: ValidationError[]; itemErrors: Map<number, ValidationError[]> } {
  const allErrors: ValidationError[] = []
  const itemErrors = new Map<number, ValidationError[]>()

  arr.forEach((item, index) => {
    const result = validateObject(item, schema)
    if (!result.valid) {
      itemErrors.set(index, result.errors)
      allErrors.push(...result.errors)
    }
  })

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    itemErrors,
  }
}
