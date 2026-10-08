export type EvidenceStatus = 'verified' | 'qualified' | 'pending'

export type LedgerEntry = {
  id: string
  claim: string
  value: number
  unit: string
  year: number
  geography: string
  industry: string
  methodology: string
  sourceTitle: string
  sourceUrl: string
  originalDocumentUrl: string
  sourceType: 'official' | 'research' | 'corporate' | 'simulation'
  verificationStatus: EvidenceStatus
  checkedAt: string
  caveats: string
  independentCorroboration: string
  capabilities: string[]
}
