import { readFile } from 'node:fs/promises'

const entries = JSON.parse(await readFile(new URL('../src/data/data-ledger.json', import.meta.url), 'utf8'))
const adoption = JSON.parse(await readFile(new URL('../src/data/adoption-series.json', import.meta.url), 'utf8'))
const errors = []

for (const entry of entries) {
  if (entry.verificationStatus === 'pending') errors.push(`${entry.id}: pending entries cannot ship`)
  for (const field of ['id', 'claim', 'unit', 'year', 'sourceTitle', 'sourceUrl', 'checkedAt']) {
    if (entry[field] === '' || entry[field] === undefined || entry[field] === null) errors.push(`${entry.id || 'unknown'}: missing ${field}`)
  }
  if (entry.sourceType === 'corporate' && entry.verificationStatus !== 'qualified') errors.push(`${entry.id}: corporate evidence must be qualified`)
}

const entryIds = new Set(entries.map((entry) => entry.id))
for (const [scene, data] of Object.entries(adoption)) {
  if (!data.ledgerId) errors.push(`adoption.${scene}: missing ledgerId`)
  else if (!entryIds.has(data.ledgerId)) errors.push(`adoption.${scene}: unknown ledgerId ${data.ledgerId}`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`Validated ${entries.length} evidence entries and ${Object.keys(adoption).length} adoption scenes.`)
