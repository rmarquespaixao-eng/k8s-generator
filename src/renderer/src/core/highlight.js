// Minimal YAML syntax highlighter -> HTML string with .hl-* classes.
// Operates line-by-line on our own generated output (not a general YAML parser).

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightValue(raw) {
  const v = raw.trim()
  if (v === '') return ''
  if (v.includes('{{')) return `<span class="hl-tpl">${esc(raw)}</span>` // Helm template
  if (v === 'true' || v === 'false' || v === 'null') return `<span class="hl-bool">${esc(raw)}</span>`
  if (/^-?\d+(\.\d+)?$/.test(v)) return `<span class="hl-num">${esc(raw)}</span>`
  if (/^["'].*["']$/.test(v)) return `<span class="hl-str">${esc(raw)}</span>`
  return `<span class="hl-str">${esc(raw)}</span>`
}

export function highlightYaml(text) {
  return text
    .split('\n')
    .map((line) => {
      // comment / file marker (we emit "# === path ===")
      const comment = line.match(/^(\s*)(#.*)$/)
      if (comment) return `${comment[1]}<span class="hl-comment">${esc(comment[2])}</span>`

      if (/^---\s*$/.test(line)) return `<span class="hl-doc">---</span>`

      // "<indent>- " list item, optionally followed by "key: value"
      const item = line.match(/^(\s*)(- )(.*)$/)
      if (item) {
        const rest = item[3]
        const kv = rest.match(/^([^:\s][^:]*):(\s?)(.*)$/)
        const inner = kv
          ? `<span class="hl-key">${esc(kv[1])}</span>:${kv[2]}${highlightValue(kv[3])}`
          : highlightValue(rest)
        return `${item[1]}<span class="hl-dash">-</span> ${inner}`
      }

      // "<indent>key: value"
      const kv = line.match(/^(\s*)([^:\s][^:]*):(\s?)(.*)$/)
      if (kv) {
        return `${kv[1]}<span class="hl-key">${esc(kv[2])}</span>:${kv[3]}${highlightValue(kv[4])}`
      }

      return esc(line)
    })
    .join('\n')
}
