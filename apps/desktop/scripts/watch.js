const esbuild = require('esbuild');
const { createServer } = require('http');

const clients = [];

esbuild
  .build({
    entryPoints: ['./src/main.ts'],
    bundle: true,
    outdir: './resources/js/',
    legalComments: 'external',
    sourcemap: 'inline',
    format: 'esm',
    define: {
      'process.env.NODE_ENV': '"development"',
    },
    banner: {
      js: ';(() => new EventSource("http://localhost:8082").onmessage = () => location.reload())();',
    },
    watch: {
      onRebuild(error) {
        clients.forEach((res) => res.write('data: update\n\n'));
        clients.length = 0;
        console.log(error ? error : '...');
      },
    },
  })
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });

createServer((req, res) => clients.push(
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    Connection: 'keep-alive',
  }),
)).listen(8082);
