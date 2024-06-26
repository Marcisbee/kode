const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['./src/main.ts'],
    bundle: true,
    treeShaking: true,
    drop: ['console'],
    platform: 'browser',
    splitting: true,
    minify: true,
    outdir: './resources/js/',
    legalComments: 'external',
    sourcemap: false,
    format: 'esm',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    metafile: true,
    mangleProps: /^_/,
    loader: {
      '.woff2': 'file',
    },
    inject: [
      './scripts/preact-shim.js',
    ],
  })
  .then(async (result) => {
    const text = await esbuild.analyzeMetafile(result.metafile);
    console.log(text);
  })
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
