const esbuild = require('esbuild');

esbuild
  .serve({
    servedir: './public',
  }, {
    entryPoints: ['./src/main.ts'],
    bundle: true,
    legalComments: 'external',
    sourcemap: 'inline',
    format: 'esm',
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  })
  .then((server) => {
    console.log(`Editor running on http://127.0.0.1:${server.port}`);
    // Call "stop" on the web server to stop serving
    // server.stop()
  })
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
