// Configuração da API do Google Sheets
const SPREADSHEET_ID = '1Fr6QMP7mq9e7Beh0i0jXecUoCssWV-8puVUt6BTlMTg'
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY

// Interface para os dados dos ativos conforme estrutura da planilha
export interface Ativo {
  sigla: string           // Código da ação (ex: PETR4)
  referencia: string      // Nome da empresa ou título (ex: Petrobras PN)
  precoAtual: number      // Valor atual da ação
  variacao: number        // Diferença em relação ao dia anterior
  variacaoPercentual: number // Variação em %
  volume: number          // Volume negociado no dia
  valorMercado: number    // Valor de mercado total
  ultimaAtualizacao: string // Data e hora da última atualização
}

// Interface para os dados da planilha
export interface PlanilhaData {
  ativos: Ativo[]
  ultimaAtualizacao: string
  totalAtivos: number
}

// Função para buscar dados da planilha
export const fetchPlanilhaData = async (): Promise<PlanilhaData> => {
  try {
    if (!API_KEY) {
      return await fetchPlanilhaPublica()
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:H?key=${API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Erro ao buscar dados da API do Google Sheets')
    }

    const data = await response.json()
    const rows = data.values

    if (!rows || rows.length === 0) {
      throw new Error('Nenhum dado encontrado na planilha')
    }

    const ativos = processarDadosPlanilha(rows)

    return {
      ativos,
      ultimaAtualizacao: new Date().toISOString(),
      totalAtivos: ativos.length
    }
  } catch (error) {
    console.error('Erro ao buscar dados da planilha:', error)
    return await fetchPlanilhaPublica()
  }
}

// Função para buscar dados da planilha pública (sem API key)
const fetchPlanilhaPublica = async (): Promise<PlanilhaData> => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Erro ao buscar dados da planilha')
    }

    const csvText = await response.text()
    const rows = parseCSV(csvText)

    const ativos = processarDadosPlanilha(rows)

    return {
      ativos,
      ultimaAtualizacao: new Date().toISOString(),
      totalAtivos: ativos.length
    }
  } catch (error) {
    console.error('Erro ao buscar dados públicos da planilha:', error)
    return {
      ativos: [],
      ultimaAtualizacao: new Date().toISOString(),
      totalAtivos: 0
    }
  }
}

// Função para processar os dados da planilha conforme estrutura dada
const processarDadosPlanilha = (rows: (string | number | null)[][]): Ativo[] => {
  const dataRows = rows.slice(1) // pula cabeçalho

  return dataRows
    .filter(row => row.length > 0 && row[0]) // ignora linhas vazias
    .map((row, index) => {
      try {
        // Converte string para número considerando possíveis formatos brasileiros
        const parseNumber = (str: string | undefined) => {
          if (!str) return 0
          const normalized = str.replace(/\./g, '').replace(',', '.')
          return parseFloat(normalized) || 0
        }

        // Volume e valorMercado geralmente são números inteiros, removemos tudo que não for dígito
        const parseInteger = (str: string | undefined) => {
          if (!str) return 0
          const digitsOnly = str.replace(/\D/g, '')
          return parseInt(digitsOnly) || 0
        }

        // Tenta converter data do formato DD/MM/YYYY HH:mm:ss para ISO
        const parseDate = (str: string | undefined) => {
          if (!str) return new Date().toISOString()
          const parts = str.split(' ')
          if (parts.length === 2) {
            const [datePart, timePart] = parts
            const [day, month, year] = datePart.split('/')
            if (day && month && year) {
              const iso = new Date(`${year}-${month}-${day}T${timePart}`).toISOString()
              return iso
            }
          }
          return new Date().toISOString()
        }

        return {
          sigla: String(row[0] || '').trim(),
          referencia: String(row[1] || '').trim(),
          precoAtual: parseNumber(String(row[2] || '')),
          variacao: parseNumber(String(row[3] || '')),
          variacaoPercentual: parseNumber(String(row[4] || '')),
          volume: parseInteger(String(row[5] || '')),
          valorMercado: parseInteger(String(row[6] || '')),
          ultimaAtualizacao: parseDate(String(row[7] || ''))
        }
      } catch (error) {
        console.warn(`Erro ao processar linha ${index + 1}:`, error)
        return null
      }
    })
    .filter((ativo): ativo is Ativo => ativo !== null)
}

// Função para fazer parse do CSV
const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n')
  return lines
    .filter(line => line.trim())
    .map(line => {
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
      return matches ? matches.map(cell => cell.replace(/^"|"$/g, '')) : []
    })
}

// Função para buscar dados de um ativo específico
export const fetchAtivoBySigla = async (sigla: string): Promise<Ativo | null> => {
  try {
    const data = await fetchPlanilhaData()
    return data.ativos.find(ativo =>
      ativo.sigla.toLowerCase() === sigla.toLowerCase()
    ) || null
  } catch (error) {
    console.error(`Erro ao buscar ativo ${sigla}:`, error)
    return null
  }
}

// Função para buscar ativos por filtro
export const fetchAtivosByFilter = async (filter: string): Promise<Ativo[]> => {
  try {
    const data = await fetchPlanilhaData()
    const filterLower = filter.toLowerCase()

    return data.ativos.filter(ativo =>
      ativo.sigla.toLowerCase().includes(filterLower) ||
      ativo.referencia.toLowerCase().includes(filterLower)
    )
  } catch (error) {
    console.error('Erro ao filtrar ativos:', error)
    return []
  }
}

// Função para buscar top ativos por variação
export const fetchTopAtivos = async (limit: number = 10): Promise<Ativo[]> => {
  try {
    const data = await fetchPlanilhaData()
    return data.ativos
      .sort((a, b) => Math.abs(b.variacaoPercentual) - Math.abs(a.variacaoPercentual))
      .slice(0, limit)
  } catch (error) {
    console.error('Erro ao buscar top ativos:', error)
    return []
  }
}


