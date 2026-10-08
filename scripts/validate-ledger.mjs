import { readFile } from 'node:fs/promises'

const entries = JSON.parse(await readFile(new URL('../src/data/data-ledger.json', import.meta.url), 'utf8'))
const errors = []

for (const entry of entries) {
  if (entry.verificationStatus === 'pending') errors.push(`${entry.id}: pending entries cannot ship`)
  for (const field of ['id', 'claim', 'unit', 'year', 'sourceTitle', 'sourceUrl', 'checkedAt']) {
    if (entry[field] === '' || entry[field] === undefined || entry[field] === null) errors.push(`${entry.id || 'unknown'}: missing ${field}`)
  }
  if (entry.sourceType === 'corporate' && entry.verificationStatus !== 'qualified') errors.push(`${entry.id}: corporate evidence must be qualified`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`Validated ${entries.length} evidence entries.`)
