// @ts-check
import { context } from 'esbuild';

const ctx = await context({
  entryPoints: ['./src/main.ts'],
  bundle: true,
  write: false,
  outdir: './public',
  legalComments: 'external',
  sourcemap: 'external',
  format: 'esm',
  minify: true,
  treeShaking: true,
  define: {
    'process.env.NODE_ENV': '"development"',
  },
});

await ctx.watch();

const server = await ctx.serve({
  servedir: 'public',
});

console.log(`Editor running on http://127.0.0.1:${server.port}`);

// esbuild
//   .serve({
//     servedir: './public',
//   }, {
//     entryPoints: ['./src/main.ts'],
//     bundle: true,
//     legalComments: 'external',
//     sourcemap: 'external',
//     format: 'esm',
//     minify: true,
//     treeShaking: true,
//     define: {
//       'process.env.NODE_ENV': '"development"',
//     },
//   })
//   .then((server) => {
//     console.log(`Editor running on http://127.0.0.1:${server.port}`);
//     // Call "stop" on the web server to stop serving
//     // server.stop()
//   })
//   .catch((e) => {
//     console.log(e);
//     process.exit(1);
//   });
