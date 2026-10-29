import { createServer, IncomingMessage, ServerResponse } from "http"
import { readFileSync, existsSync } from "fs"
import { join, extname } from "path"

const PORT = 3000

const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".ts": "text/typescript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {

    const staticFile = join("dist", req.url || "")
    if (existsSync(staticFile) && !staticFile.endsWith("/")) {
        const ext = extname(staticFile)
        const contentType = mimeTypes[ext] || "application/octet-stream"
        const content = readFileSync(staticFile)
        res.writeHead(200, {"Content-Type": contentType})
        return res.end(content)
    }

    const index = readFileSync(join("dist", "index.html"))
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end(index)
})

server.listen(PORT, "0.0.0.0", () => {
    console.log(`SPA running on http://localhost:${PORT}`)
})
