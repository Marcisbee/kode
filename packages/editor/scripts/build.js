const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['./src/kode.ts'],
    bundle: true,
    treeShaking: true,
    drop: ['console'],
    platform: 'browser',
    splitting: true,
    minify: true,
    outdir: './dist',
    legalComments: 'external',
    sourcemap: false,
    format: 'esm',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    metafile: true,
  })
  .then(async (result) => {
    const text = await esbuild.analyzeMetafile(result.metafile);
    console.log(text);
  })
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
