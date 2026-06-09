import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount)
}

export const calculateDaysRemaining = (expirationDate: string) => {
  const now = new Date()
  const expiration = new Date(expirationDate)
  const diff = expiration.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
}

export const calculateDaysExpired = (expirationDate: string) => {
  const now = new Date()
  const expiration = new Date(expirationDate)
  const diff = now.getTime() - expiration.getTime()
  return Math.floor(diff / (1000 * 3600 * 24))
}

/**
 * Formata um CNPJ enquanto o usuário digita
 * @param value O valor a ser formatado
 * @returns O CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(value: string): string {
  // Remove todos os caracteres não numéricos
  const cnpjDigits = value.replace(/\D/g, "")

  // Limita a 14 dígitos
  const limitedDigits = cnpjDigits.slice(0, 14)

  // Aplica a máscara XX.XXX.XXX/XXXX-XX
  let formattedCNPJ = limitedDigits

  if (limitedDigits.length > 2) {
    formattedCNPJ = limitedDigits.replace(/^(\d{2})/, "$1.")
  }
  if (limitedDigits.length > 5) {
    formattedCNPJ = formattedCNPJ.replace(/^(\d{2})\.(\d{3})/, "$1.$2.")
  }
  if (limitedDigits.length > 8) {
    formattedCNPJ = formattedCNPJ.replace(/^(\d{2})\.(\d{3})\.(\d{3})/, "$1.$2.$3/")
  }
  if (limitedDigits.length > 12) {
    formattedCNPJ = formattedCNPJ.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})/, "$1.$2.$3/$4-")
  }

  return formattedCNPJ
}

/**
 * Valida um CNPJ
 * @param cnpj O CNPJ a ser validado (pode estar formatado ou apenas com dígitos)
 * @returns true se o CNPJ for válido, false caso contrário
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, "")

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) {
    return false
  }

  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return false
  }

  // Algoritmo de validação do CNPJ
  let size = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, size)
  const digits = cleanCNPJ.substring(size)
  let sum = 0
  let pos = size - 7

  // Cálculo do primeiro dígito verificador
  for (let i = size; i >= 1; i--) {
    sum += Number.parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number.parseInt(digits.charAt(0))) {
    return false
  }

  // Cálculo do segundo dígito verificador
  size += 1
  numbers = cleanCNPJ.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += Number.parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number.parseInt(digits.charAt(1))) {
    return false
  }

  return true
}

/**
 * Verifica se um CNPJ está no formato correto (XX.XXX.XXX/XXXX-XX)
 * @param cnpj O CNPJ a ser verificado
 * @returns true se o formato estiver correto, false caso contrário
 */
export function isCNPJFormatValid(cnpj: string): boolean {
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
  return cnpjRegex.test(cnpj)
}

/**
 * Verifica se um CNPJ é válido (formato e dígitos verificadores)
 * @param cnpj O CNPJ a ser validado
 * @returns Um objeto com o resultado da validação e uma mensagem de erro, se houver
 */
export function validateCNPJWithDetails(cnpj: string): { isValid: boolean; message?: string } {
  if (!cnpj || cnpj.trim() === "") {
    return { isValid: false, message: "CNPJ/CPF é obrigatório" }
  }

  if (!isCNPJFormatValid(cnpj)) {
    return { isValid: false, message: "Formato inválido. Use: XX.XXX.XXX/XXXX-XX" }
  }

  if (!validateCNPJ(cnpj)) {
    return { isValid: false, message: "CNPJ inválido" }
  }

  return { isValid: true }
}

/**
 * Formata um CPF enquanto o usuário digita
 * @param value O valor a ser formatado
 * @returns O CPF formatado (XXX.XXX.XXX-XX)
 */
export function formatCPF(value: string): string {
  // Remove todos os caracteres não numéricos
  const cpfDigits = value.replace(/\D/g, "")

  // Limita a 11 dígitos
  const limitedDigits = cpfDigits.slice(0, 11)

  // Aplica a máscara XXX.XXX.XXX-XX
  let formattedCPF = limitedDigits

  if (limitedDigits.length > 3) {
    formattedCPF = limitedDigits.replace(/^(\d{3})/, "$1.")
  }
  if (limitedDigits.length > 6) {
    formattedCPF = formattedCPF.replace(/^(\d{3})\.(\d{3})/, "$1.$2.")
  }
  if (limitedDigits.length > 9) {
    formattedCPF = formattedCPF.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, "$1.$2.$3-")
  }

  return formattedCPF
}

/**
 * Valida um CPF
 * @param cpf O CPF a ser validado (pode estar formatado ou apenas com dígitos)
 * @returns true se o CPF for válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "")

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false
  }

  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return false
  }

  // Cálculo do primeiro dígito verificador
  let sum = 0
  let multiplier = 10

  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleanCPF.charAt(i)) * multiplier
    multiplier--
  }

  let remainder = sum % 11
  const firstDigit = remainder < 2 ? 0 : 11 - remainder

  if (firstDigit !== Number.parseInt(cleanCPF.charAt(9))) {
    return false
  }

  // Cálculo do segundo dígito verificador
  sum = 0
  multiplier = 11

  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleanCPF.charAt(i)) * multiplier
    multiplier--
  }

  remainder = sum % 11
  const secondDigit = remainder < 2 ? 0 : 11 - remainder

  if (secondDigit !== Number.parseInt(cleanCPF.charAt(10))) {
    return false
  }

  return true
}

/**
 * Verifica se um CPF está no formato correto (XXX.XXX.XXX-XX)
 * @param cpf O CPF a ser verificado
 * @returns true se o formato estiver correto, false caso contrário
 */
export function isCPFFormatValid(cpf: string): boolean {
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
  return cpfRegex.test(cpf)
}

/**
 * Detecta se uma string é um CNPJ ou CPF válido
 * @param value O valor a ser verificado
 * @returns 'cnpj' | 'cpf' | 'invalid'
 */
export function detectDocumentType(value: string): 'cnpj' | 'cpf' | 'invalid' {
  const cleanValue = value.replace(/\D/g, "")

  if (cleanValue.length === 14 && validateCNPJ(value)) {
    return 'cnpj'
  }
  if (cleanValue.length === 11 && validateCPF(value)) {
    return 'cpf'
  }

  return 'invalid'
}

/**
 * Formata e valida um documento (CNPJ ou CPF)
 * @param value O valor a ser validado
 * @returns Um objeto com o resultado da validação e uma mensagem de erro, se houver
 */
export function validateDocumentWithDetails(value: string): { isValid: boolean; type?: 'cnpj' | 'cpf'; message?: string } {
  if (!value || value.trim() === "") {
    return { isValid: false, message: "CNPJ/CPF é obrigatório" }
  }

  const cleanValue = value.replace(/\D/g, "")

  // Verificar se é CNPJ
  if (cleanValue.length === 14) {
    if (!isCNPJFormatValid(value)) {
      return { isValid: false, message: "Formato inválido. Use: XX.XXX.XXX/XXXX-XX" }
    }
    if (!validateCNPJ(value)) {
      return { isValid: false, message: "CNPJ inválido" }
    }
    return { isValid: true, type: 'cnpj' }
  }

  // Verificar se é CPF
  if (cleanValue.length === 11) {
    if (!isCPFFormatValid(value)) {
      return { isValid: false, message: "Formato inválido. Use: XXX.XXX.XXX-XX" }
    }
    if (!validateCPF(value)) {
      return { isValid: false, message: "CPF inválido" }
    }
    return { isValid: true, type: 'cpf' }
  }

  return { isValid: false, message: "Digite um CNPJ (14 dígitos) ou CPF (11 dígitos) válido" }
}

/**
 * Formata uma string como CNPJ ou CPF automaticamente
 * @param value O valor a ser formatado
 * @returns O documento formatado ou vazio se inválido
 */
export function formatDocument(value: string): string {
  const cleanValue = value.replace(/\D/g, "")

  if (cleanValue.length <= 11) {
    // Se tem 11 ou menos dígitos, formatar como CPF
    return formatCPF(value)
  } else {
    // Se tem mais de 11, formatar como CNPJ
    return formatCNPJ(value)
  }
}
