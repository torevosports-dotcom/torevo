const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 4000
const BASE = path.join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.json': 'application/json',
}

http.createServer((req, res) => {
  let filePath = path.join(BASE, req.url.split('?')[0])
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(BASE, 'index.html')
  }
  const ext = path.extname(filePath).toLowerCase()
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  fs.createReadStream(filePath).pipe(res)
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Togo app running at http://localhost:${PORT}`)
})
