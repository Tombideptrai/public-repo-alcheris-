import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sandpackRuntimeRoot = path.resolve(
  __dirname,
  'node_modules/@codesandbox/sandpack-client/sandpack'
)

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.wasm': 'application/wasm'
}

const sandpackRuntimeHost = () => ({
  name: 'mindmake-sandpack-runtime-host',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const host = req.headers.host?.split(':')[0]
      if (host !== 'sandpack.localhost') {
        next()
        return
      }

      const requestUrl = new URL(req.url || '/', 'http://sandpack.localhost')
      const pathname = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname)
      const filePath = path.normalize(path.join(sandpackRuntimeRoot, pathname))

      if (!filePath.startsWith(sandpackRuntimeRoot)) {
        res.statusCode = 403
        res.end('Forbidden')
        return
      }

      fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
          res.statusCode = 404
          res.end('Not found')
          return
        }

        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
        res.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'application/octet-stream')
        fs.createReadStream(filePath).pipe(res)
      })
    })
  }
})

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['iOS >= 12', 'Safari >= 12'],
      modernPolyfills: true,
    }),
    sandpackRuntimeHost()
  ],
  build: {
    cssTarget: ['safari12'],
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          const normalizedId = id.replace(/\\/g, '/');
          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/react-router-dom/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'vendor-editor';
          if (id.includes('@codesandbox') || id.includes('sandpack')) return 'vendor-sandpack';
          if (id.includes('pdfjs-dist') || id.includes('react-pdf')) return 'vendor-pdf';
          if (id.includes('@tiptap') || id.includes('@lexical') || id.includes('lexical')) return 'vendor-richtext';
          if (id.includes('@dnd-kit') || id.includes('dnd-kit')) return 'vendor-dnd';
          return undefined;
        },
      },
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1', 'sandpack.localhost'],
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless", // <--- MUST BE CREDENTIALLESS
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  }
})
