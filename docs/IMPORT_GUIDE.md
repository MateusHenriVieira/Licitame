# Guia de Importação de Contratos

Este documento descreve como preparar arquivos para importação de contratos no sistema.

## Formatos Suportados

- **CSV** (.csv)
- **Excel** (.xlsx, .xls)
- **JSON** (.json)

## Campos Obrigatórios

Os seguintes campos são **obrigatórios** para importação:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| number | Número do contrato | "CT-2024-001" |
| company | Nome da empresa | "Empresa XYZ Ltda" |
| value | Valor total do contrato | 150000.00 |
| expirationDate | Data de vencimento | "2024-12-31" |
| startDate | Data de início | "2024-01-01" |
| costBase | Base de custo | "Matriz São Paulo" |
| description | Descrição do contrato | "Fornecimento de materiais" |

## Campos Opcionais

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| status | Status do contrato | "ativo", "vencido", "expirado", "cancelado" |
| items | Lista de itens do contrato | Array de objetos |
| supplierId | ID do fornecedor | "supplier_123" |
| productIds | IDs dos produtos | ["prod_1", "prod_2"] |

## Formato CSV

### Exemplo de Arquivo CSV

\`\`\`csv
number,company,value,expirationDate,startDate,costBase,description,status
"CT-2024-001","Empresa XYZ Ltda",150000.00,"2024-12-31","2024-01-01","Matriz São Paulo","Fornecimento de materiais","ativo"
"CT-2024-002","Fornecedor ABC",75000.50,"2024-06-30","2024-01-15","Filial Rio","Serviços de manutenção","ativo"
\`\`\`

### Dicas para CSV

- Use **ponto e vírgula (;)** ou **vírgula (,)** como delimitador
- Aspas duplas para textos que contém vírgulas
- Formato de data: `YYYY-MM-DD` ou `DD/MM/YYYY`
- Valores numéricos podem usar ponto ou vírgula como decimal

## Formato Excel

### Exemplo de Planilha

| numero | empresa | valor | vencimento | inicio | base_custo | descricao | status |
|--------|---------|-------|------------|--------|------------|-----------|--------|
| CT-2024-001 | Empresa XYZ | 150000 | 31/12/2024 | 01/01/2024 | Matriz SP | Materiais | ativo |
| CT-2024-002 | Fornecedor ABC | 75000.5 | 30/06/2024 | 15/01/2024 | Filial RJ | Manutenção | ativo |

### Dicas para Excel

- Use a **primeira linha** como cabeçalho
- Formate células de data como **Data**
- Formate células de valor como **Moeda** ou **Número**
- O sistema detecta automaticamente o formato brasileiro

## Formato JSON

### Exemplo de Arquivo JSON

\`\`\`json
[
  {
    "number": "CT-2024-001",
    "company": "Empresa XYZ Ltda",
    "value": 150000.00,
    "expirationDate": "2024-12-31",
    "startDate": "2024-01-01",
    "costBase": "Matriz São Paulo",
    "description": "Fornecimento de materiais de escritório",
    "status": "ativo",
    "items": [
      {
        "name": "Papel A4",
        "description": "Resma 500 folhas",
        "quantity": 100,
        "unitPrice": 25.00,
        "totalPrice": 2500.00
      }
    ]
  },
  {
    "number": "CT-2024-002",
    "company": "Fornecedor ABC",
    "value": 75000.50,
    "expirationDate": "2024-06-30",
    "startDate": "2024-01-15",
    "costBase": "Filial Rio de Janeiro",
    "description": "Serviços de manutenção predial",
    "status": "ativo"
  }
]
\`\`\`

### Estrutura de Items (Opcional)

\`\`\`json
{
  "items": [
    {
      "name": "Nome do item",
      "description": "Descrição do item",
      "quantity": 100,
      "unitPrice": 25.00,
      "totalPrice": 2500.00
    }
  ]
}
\`\`\`

## Mapeamento Automático de Colunas

O sistema reconhece automaticamente várias variações de nomes de colunas:

### Número do Contrato
- `numero`, `number`, `contrato`, `contract`, `num_contrato`, `contract_number`

### Empresa
- `empresa`, `company`, `fornecedor`, `supplier`, `nome_empresa`

### Valor
- `valor`, `value`, `valor_total`, `total_value`, `amount`

### Data de Vencimento
- `vencimento`, `expiration_date`, `data_vencimento`, `expiry_date`, `validade`

### Data de Início
- `inicio`, `start_date`, `data_inicio`, `start`

### Base de Custo
- `base_custo`, `cost_base`, `base`, `centro_custo`, `cost_center`

### Descrição
- `descricao`, `description`, `desc`, `detalhes`, `details`

### Status
- `status`, `estado`, `state`, `situacao`

## Processo de Importação

1. **Preparar o arquivo** seguindo os formatos acima
2. **Clicar em "Importar"** na página de contratos
3. **Selecionar o arquivo** (CSV, Excel ou JSON)
4. **Aguardar o processamento** automático
5. **Revisar os dados** detectados
6. **Confirmar a importação**

## Tratamento de Erros

O sistema exibe:

- ✅ **Avisos**: Linhas com dados faltando (serão ignoradas)
- ❌ **Erros**: Problemas críticos que impedem a importação
- ℹ️ **Informações**: Resumo do processamento

## Dicas Gerais

- **Teste com poucos registros** primeiro
- **Exporte contratos existentes** para ver o formato
- **Use UTF-8** para caracteres especiais
- **Revise dados** antes de confirmar
- **Backup** antes de importações grandes

## Exemplos de Arquivos

Arquivos de exemplo estão disponíveis em:
- `/docs/examples/contratos-exemplo.csv`
- `/docs/examples/contratos-exemplo.xlsx`
- `/docs/examples/contratos-exemplo.json`
