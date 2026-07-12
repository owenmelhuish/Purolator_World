import { defineConfig } from 'vite';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// The layout editor (?edit) POSTs every change here; it is written straight
// into the world's layout json so adjustments are baked into the source
// permanently. Each world keeps its own file: /__layout?world=choice →
// src/layout-choice.json (no param → the Purolator src/layout.json).
const WORLDS = ['purolator', 'choice', 'humber', 'cira'];
const layoutFile = (world) =>
  fileURLToPath(new URL(
    !world || world === 'purolator' ? './src/layout.json' : `./src/layout-${world}.json`,
    import.meta.url,
  ));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        choice: fileURLToPath(new URL('./choice.html', import.meta.url)),
        humber: fileURLToPath(new URL('./humber.html', import.meta.url)),
        cira: fileURLToPath(new URL('./cira.html', import.meta.url)),
      },
    },
  },
  server: {
    // don't hot-reload the page every time the editor saves the layout
    watch: { ignored: ['**/src/layout.json', '**/src/layout-*.json'] },
  },
  plugins: [
    {
      name: 'layout-sync',
      configureServer(server) {
        server.middlewares.use('/__layout', (req, res) => {
          const url = new URL(req.url, 'http://x');
          const world = url.searchParams.get('world') || 'purolator';
          if (!WORLDS.includes(world)) {
            res.statusCode = 400;
            res.end('unknown world');
            return;
          }
          const file = layoutFile(world);
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (c) => { body += c; });
            req.on('end', () => {
              try {
                JSON.parse(body); // validate before touching the file
                fs.writeFileSync(file, body.endsWith('\n') ? body : body + '\n');
                res.statusCode = 200;
                res.end('ok');
              } catch {
                res.statusCode = 400;
                res.end('bad json');
              }
            });
          } else if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '{}');
          } else {
            res.statusCode = 405;
            res.end();
          }
        });
      },
    },
  ],
});
