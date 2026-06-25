import { readdir, mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DOCX_DIR = join(ROOT, 'docs', 'legal')
const OUT_DIR = join(ROOT, 'content')

const FILE_MAP = {
  'Privacy-PolicyV2 22.06.2026.docx': 'privacy-policy.md',
  'Terms-and-condition-v2.docx': 'terms-and-conditions.md',
}

const PANDOC_ARGS = [
  '--wrap=none',
  '--markdown-headings=atx',
  '-t',
  'markdown_strict+fancy_lists+pipe_tables',
]

function runPandoc(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn('pandoc', [...PANDOC_ARGS, '-o', outputPath, inputPath], {
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    proc.on('error', reject)
    proc.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`pandoc exited with code ${code}`))
    })
  })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const docxFiles = (await readdir(DOCX_DIR)).filter(
    (f) => f.endsWith('.docx') && !f.startsWith('~$'),
  )

  for (const docx of docxFiles) {
    const mdName = FILE_MAP[docx]
    if (!mdName) {
      console.log(`Skipping unmapped: ${docx}`)
      continue
    }
    const inputPath = join(DOCX_DIR, docx)
    const outputPath = join(OUT_DIR, mdName)
    console.log(`Converting ${docx} → ${mdName}`)
    await runPandoc(inputPath, outputPath)
  }

  console.log('\nDone. Review content/ — hand-clean:')
  console.log('  - heading hierarchy: demote `# 1.` → `## 1.`; promote any 13.1/13.2 inline bold to `### 13.1`')
  console.log('  - cross-reference links between privacy.md ↔ terms.md')
  console.log('  - remove `<span class="mark">\\[make this an accessible link\\]</span>` annotation in terms 10.2')
  console.log('  - add document title (`# Privacy Policy`, `# Terms of Use`) and `_Last updated: YYYY-MM-DD_` near the top')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
