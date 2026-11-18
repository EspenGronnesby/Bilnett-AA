// Stops the website build if the shared Party core (rave-core, Kotlin) changed after its built JS
// copy (web/src/core/generated) was made. Fix: ./gradlew :rave-core:syncWebCore and commit.
// Same fingerprint recipe as syncWebCore in rave-core/build.gradle.kts.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const web = fileURLToPath(new URL('..', import.meta.url))
const core = join(web, '..', 'rave-core')
const stamp = join(web, 'src', 'core', 'generated', 'SOURCE_HASH')

if (!existsSync(core)) {
  console.log('check-core: rave-core not found next to web/, skipping')
  process.exit(0)
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.kt')) out.push(p)
  }
  return out
}

const files = ['src/commonMain', 'src/jsMain'].flatMap(d => walk(join(core, d)))
  .map(p => [relative(core, p).split(sep).join('/'), p])
  .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
const md = createHash('sha256')
for (const [rel, p] of files) { md.update(`${rel}\n`); md.update(readFileSync(p)); md.update('\n') }
const now = md.digest('hex')
const built = existsSync(stamp) ? readFileSync(stamp, 'utf8').trim() : '(missing)'
if (now !== built) {
  console.error(`check-core: the Party core (rave-core) changed since its JS copy was built.\n  Run: ./gradlew :rave-core:syncWebCore  and commit web/src/core/generated.\n  (source ${now.slice(0, 12)} ≠ built ${built.slice(0, 12)})`)
  process.exit(1)
}
console.log(`check-core: OK (${now.slice(0, 12)})`)
