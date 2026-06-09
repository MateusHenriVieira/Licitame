# Guia de Importação de Fornecedores

Este guia explica como importar fornecedores em massa para o sistema usando arquivos CSV, Excel ou JSON.

## Formatos Suportados

- **CSV** (.csv)
- **Excel** (.xlsx, .xls)
- **JSON** (.json)

## Campos Obrigatórios

Os seguintes campos são **obrigatórios** em todos os formatos:

1. **Nome** - Nome ou razão social do fornecedor
2. **CNPJ** - CNPJ ou CPF do fornecedor
3. **Categoria** - Categoria do fornecedor

## Campos Opcionais

- **Email** - Email de contato
- **Telefone** - Telefone de contato
- **Endereço** - Endereço completo
- **Cidade** - Cidade
- **Estado** - Estado (UF)
- **CEP** - Código postal
- **Avaliação** - Nota de 0 a 5
- **Status** - Ativo ou Inativo
- **Pessoa de Contato** - Nome do responsável
- **Website** - Site da empresa
- **Observações** - Notas adicionais

## Formato CSV

### Exemplo de arquivo CSV:

\`\`\`csv
Nome,CNPJ,Categoria,Email,Telefone,Endereço,Cidade,Estado,CEP,Avaliação,Status
Fornecedor ABC,12.345.678/0001-90,Tecnologia,contato@abc.com,(11) 98765-4321,Rua ABC 123,São Paulo,SP,01234-567,5,Ativo
Fornecedor XYZ,98.765.432/0001-10,Serviços,contato@xyz.com,(21) 91234-5678,Av XYZ 456,Rio de Janeiro,RJ,20000-000,4.5,Ativo
\`\`\`

### Notas sobre CSV:

- Use vírgula (`,`) ou ponto e vírgula (`;`) como delimitador
- A primeira linha deve conter os nomes das colunas
- Codificação recomendada: UTF-8

## Formato Excel

### Estrutura da planilha:

| Nome | CNPJ | Categoria | Email | Telefone | Cidade | Estado | CEP |
|------|------|-----------|-------|----------|--------|--------|-----|
| Fornecedor ABC | 12.345.678/0001-90 | Tecnologia | contato@abc.com | (11) 98765-4321 | São Paulo | SP | 01234-567 |
| Fornecedor XYZ | 98.765.432/0001-10 | Serviços | contato@xyz.com | (21) 91234-5678 | Rio de Janeiro | RJ | 20000-000 |

### Notas sobre Excel:

- A primeira linha deve conter os nomes das colunas
- Use a primeira aba da planilha
- Formatos suportados: .xlsx e .xls

## Formato JSON

### Exemplo de arquivo JSON:

\`\`\`json
[
  {
    "nome": "Fornecedor ABC",
    "cnpj": "12.345.678/0001-90",
    "categoria": "Tecnologia",
    "email": "contato@abc.com",
    "telefone": "(11) 98765-4321",
    "endereco": "Rua ABC 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "avaliacao": 5,
    "ativo": true,
    "pessoa_contato": "João Silva",
    "website": "https://www.abc.com",
    "observacoes": "Cliente prioritário"
  },
  {
    "nome": "Fornecedor XYZ",
    "cnpj": "98.765.432/0001-10",
    "categoria": "Serviços",
    "email": "contato@xyz.com",
    "telefone": "(21) 91234-5678",
    "endereco": "Av XYZ 456",
    "cidade": "Rio de Janeiro",
    "estado": "RJ",
    "cep": "20000-000",
    "avaliacao": 4.5,
    "ativo": true
  }
]
\`\`\`

### Notas sobre JSON:

- Deve ser um array de objetos
- Use aspas duplas para strings
- Valores booleanos: `true` ou `false`
- Valores numéricos sem aspas

## Mapeamento de Colunas

O sistema reconhece automaticamente várias variações de nomes de colunas:

### Nome
- `nome`, `name`, `razao social`, `razão social`, `empresa`, `fornecedor`

### CNPJ
- `cnpj`, `documento`, `doc`, `cpf/cnpj`

### Categoria
- `categoria`, `category`, `tipo`, `segmento`, `ramo`

### Email
- `email`, `e-mail`, `mail`, `contato email`

### Telefone
- `telefone`, `phone`, `tel`, `celular`, `contato`, `fone`

### Endereço
- `endereco`, `endereço`, `address`, `rua`, `logradouro`

### Cidade
- `cidade`, `city`, `municipio`, `município`

### Estado
- `estado`, `state`, `uf`, `sigla estado`

### CEP
- `cep`, `zip`, `zipcode`, `codigo postal`, `código postal`

### Avaliação
- `avaliacao`, `avaliação`, `rating`, `nota`, `estrelas`

### Status
- `ativo`, `active`, `status`, `situacao`, `situação`

### Pessoa de Contato
- `contato`, `pessoa contato`, `responsavel`, `responsável`, `contact person`

### Website
- `website`, `site`, `web`, `url`, `homepage`

### Observações
- `observacoes`, `observações`, `notes`, `obs`, `notas`, `comentarios`, `comentários`

## Formatação de Dados

### CNPJ
- Aceita CNPJ com ou sem formatação
- Exemplos válidos:
  - `12345678000190`
  - `12.345.678/0001-90`
  - O sistema formatará automaticamente

### Telefone
- Aceita telefone com ou sem formatação
- Exemplos válidos:
  - `11987654321`
  - `(11) 98765-4321`
  - `11 98765-4321`

### CEP
- Aceita CEP com ou sem formatação
- Exemplos válidos:
  - `01234567`
  - `01234-567`

### Avaliação
- Número de 0 a 5
- Aceita decimais: `4.5`, `3.8`

### Status
- Valores aceitos para **Ativo**: `sim`, `yes`, `true`, `1`, `ativo`, `active`
- Valores aceitos para **Inativo**: `não`, `no`, `false`, `0`, `inativo`, `inactive`
- Padrão: `ativo` (se não especificado)

## Validações

O sistema valida automaticamente:

1. ✅ Presença de campos obrigatórios
2. ✅ Formato de CNPJ (14 dígitos)
3. ✅ Formato de email
4. ✅ Avaliação entre 0 e 5
5. ✅ Duplicação de CNPJ

## Processo de Importação

1. **Upload do arquivo** - Selecione ou arraste o arquivo
2. **Processamento** - O sistema analisa e valida os dados
3. **Preview** - Visualize os dados antes de importar
4. **Importação** - Confirme para adicionar ao sistema

## Dicas e Boas Práticas

### ✅ Faça

- Use templates do sistema para garantir compatibilidade
- Verifique os dados antes de importar
- Mantenha backup dos arquivos originais
- Use codificação UTF-8 para CSV

### ❌ Evite

- Arquivos com linhas em branco
- Colunas com nomes duplicados
- Caracteres especiais nos nomes das colunas
- Misturar formatos de data

## Tratamento de Erros

### Erros Bloqueantes
Impedem a importação:
- Arquivo vazio ou corrompido
- Colunas obrigatórias ausentes
- Formato de arquivo não suportado

### Avisos
Não impedem a importação, mas indicam problemas:
- Linhas com dados incompletos (serão ignoradas)
- Campos opcionais ausentes
- Valores fora do padrão esperado

## Exemplos de Templates

### Template CSV Básico
\`\`\`csv
Nome,CNPJ,Categoria,Email,Telefone
Fornecedor 1,12.345.678/0001-90,Tecnologia,contato@fornecedor1.com,(11) 98765-4321
\`\`\`

### Template CSV Completo
\`\`\`csv
Nome,CNPJ,Categoria,Email,Telefone,Endereço,Cidade,Estado,CEP,Avaliação,Status,Pessoa de Contato,Website,Observações
Fornecedor 1,12.345.678/0001-90,Tecnologia,contato@fornecedor1.com,(11) 98765-4321,Rua ABC 123,São Paulo,SP,01234-567,5,Ativo,João Silva,https://www.fornecedor1.com,Cliente preferencial
\`\`\`

### Template JSON
\`\`\`json
[
  {
    "nome": "Fornecedor Exemplo",
    "cnpj": "12.345.678/0001-90",
    "categoria": "Tecnologia",
    "email": "contato@exemplo.com",
    "telefone": "(11) 98765-4321",
    "endereco": "Rua Exemplo 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "avaliacao": 5,
    "ativo": true,
    "pessoa_contato": "João Silva",
    "website": "https://www.exemplo.com",
    "observacoes": "Fornecedor estratégico"
  }
]
\`\`\`

## Suporte

Se encontrar problemas durante a importação:

1. Verifique se o arquivo está no formato correto
2. Confirme que todas as colunas obrigatórias estão presentes
3. Revise as mensagens de erro e avisos
4. Consulte este guia para formatos e exemplos
5. Entre em contato com o suporte técnico se necessário

---

**Última atualização:** 2024
