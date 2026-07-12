import { defineConfig } from 'vite';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// The layout editor (?edit) POSTs every change here; it is written straight
// into src/layout.json so adjustments are baked into the source permanently.
const LAYOUT_FILE = fileURLToPath(new URL('./src/layout.json', import.meta.url));

export default defineConfig({
  server: {
    // don't hot-reload the page every time the editor saves the layout
    watch: { ignored: ['**/src/layout.json'] },
  },
  plugins: [
    {
      name: 'layout-sync',
      configureServer(server) {
        server.middlewares.use('/__layout', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (c) => { body += c; });
            req.on('end', () => {
              try {
                JSON.parse(body); // validate before touching the file
                fs.writeFileSync(LAYOUT_FILE, body.endsWith('\n') ? body : body + '\n');
                res.statusCode = 200;
                res.end('ok');
              } catch {
                res.statusCode = 400;
                res.end('bad json');
              }
            });
          } else if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(LAYOUT_FILE, 'utf8'));
          } else {
            res.statusCode = 405;
            res.end();
          }
        });
      },
    },
  ],
});
