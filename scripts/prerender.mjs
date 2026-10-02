// Inlines the server-rendered app into the built index.html, so every product
// and the full table exist in the HTML before any JavaScript runs.
import { readFile, writeFile, rm } from 'node:fs/promises'

const htmlPath = new URL('../dist/client/index.html', import.meta.url)
const { render } = await import(new URL('../dist/server/entry-server.js', import.meta.url).href)
const html = await readFile(htmlPath, 'utf8')
if (!html.includes('<!--app-->')) throw new Error('prerender: <!--app--> placeholder missing in index.html')
await writeFile(htmlPath, html.replace('<!--app-->', render()))
await rm(new URL('../dist/server', import.meta.url), { recursive: true })
console.log('prerendered dist/client/index.html')
