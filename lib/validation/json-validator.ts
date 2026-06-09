import { validators, type ValidationResult } from "./schemas"

export type DataType = "products" | "suppliers" | "contracts" | "orders" | "costBases" | "users" | "notifications"

export interface ValidationReport {
  dataType: DataType
  valid: boolean
  errors: string[]
  warnings: string[]
  itemCount: number
  validItemCount: number
  invalidItemCount: number
}

/**
 * Valida dados JSON antes de salvar ou carregar
 */
export class JSONValidator {
  /**
   * Valida dados de acordo com o tipo especificado
   */
  static validate(data: any, dataType: DataType): ValidationReport {
    const report: ValidationReport = {
      dataType,
      valid: true,
      errors: [],
      warnings: [],
      itemCount: 0,
      validItemCount: 0,
      invalidItemCount: 0,
    }

    // Verificar se os dados são um array
    if (!Array.isArray(data)) {
      report.valid = false
      report.errors.push("Os dados devem ser um array")
      return report
    }

    report.itemCount = data.length

    // Validar usando o schema apropriado
    const validator = validators[dataType]
    if (!validator) {
      report.valid = false
      report.errors.push(`Tipo de dados desconhecido: ${dataType}`)
      return report
    }

    const result = validator(data)
    report.valid = result.valid
    report.errors = result.errors

    // Contar itens válidos e inválidos
    if (result.valid) {
      report.validItemCount = data.length
    } else {
      // Tentar contar itens válidos individualmente
      data.forEach((item, index) => {
        const itemResult = validators[dataType]([item])
        if (itemResult.valid) {
          report.validItemCount++
        } else {
          report.invalidItemCount++
        }
      })
    }

    // Adicionar avisos para dados vazios
    if (data.length === 0) {
      report.warnings.push("O array de dados está vazio")
    }

    return report
  }

  /**
   * Valida um arquivo JSON
   */
  static async validateFile(file: File, expectedType: DataType): Promise<ValidationReport> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      return this.validate(data, expectedType)
    } catch (error) {
      return {
        dataType: expectedType,
        valid: false,
        errors: [`Erro ao processar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`],
        warnings: [],
        itemCount: 0,
        validItemCount: 0,
        invalidItemCount: 0,
      }
    }
  }

  /**
   * Sanitiza dados removendo campos inválidos
   */
  static sanitize(data: any[], dataType: DataType): any[] {
    const validator = validators[dataType]
    if (!validator) {
      return data
    }

    return data.filter((item) => {
      const result = validator([item])
      return result.valid
    })
  }

  /**
   * Gera um relatório detalhado de validação
   */
  static generateReport(report: ValidationReport): string {
    let output = `=== Relatório de Validação - ${report.dataType} ===\n\n`

    output += `Status: ${report.valid ? "✓ VÁLIDO" : "✗ INVÁLIDO"}\n`
    output += `Total de itens: ${report.itemCount}\n`
    output += `Itens válidos: ${report.validItemCount}\n`
    output += `Itens inválidos: ${report.invalidItemCount}\n\n`

    if (report.errors.length > 0) {
      output += `Erros (${report.errors.length}):\n`
      report.errors.forEach((error, index) => {
        output += `  ${index + 1}. ${error}\n`
      })
      output += "\n"
    }

    if (report.warnings.length > 0) {
      output += `Avisos (${report.warnings.length}):\n`
      report.warnings.forEach((warning, index) => {
        output += `  ${index + 1}. ${warning}\n`
      })
      output += "\n"
    }

    return output
  }

  /**
   * Valida integridade referencial entre dados relacionados
   */
  static validateReferences(products: any[], suppliers: any[], contracts: any[], orders: any[]): ValidationResult {
    const errors: string[] = []

    // Criar mapas de IDs para verificação rápida
    const supplierIds = new Set(suppliers.map((s) => s.id))
    const contractIds = new Set(contracts.map((c) => c.id))
    const productIds = new Set(products.map((p) => p.id))

    // Validar referências de produtos para fornecedores
    products.forEach((product, index) => {
      if (!supplierIds.has(product.supplierId)) {
        errors.push(`Produto ${index} (${product.name}): Fornecedor ${product.supplierId} não existe`)
      }
    })

    // Validar referências de contratos para fornecedores
    contracts.forEach((contract, index) => {
      if (contract.supplierId && !supplierIds.has(contract.supplierId)) {
        errors.push(`Contrato ${index} (${contract.number}): Fornecedor ${contract.supplierId} não existe`)
      }

      // Validar referências de produtos no contrato
      if (contract.productIds) {
        contract.productIds.forEach((productId: string) => {
          if (!productIds.has(productId)) {
            errors.push(`Contrato ${index} (${contract.number}): Produto ${productId} não existe`)
          }
        })
      }
    })

    // Validar referências de pedidos para contratos
    orders.forEach((order, index) => {
      if (!contractIds.has(order.contractId)) {
        errors.push(`Pedido ${index} (${order.number}): Contrato ${order.contractId} não existe`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Verifica duplicatas em um array de dados
   */
  static checkDuplicates(data: any[], idField = "id"): ValidationResult {
    const errors: string[] = []
    const seen = new Set<string>()

    data.forEach((item, index) => {
      const id = item[idField]
      if (seen.has(id)) {
        errors.push(`Item ${index}: ID duplicado encontrado - ${id}`)
      } else {
        seen.add(id)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
