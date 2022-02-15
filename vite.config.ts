import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: true,
    lib: {
      entry: path.resolve(__dirname, 'src/entry.ts'),
      name: 'Kode',
      fileName: (format) => `kode.${format}.js`,
    },
  },
  // esbuild: {
  //   mangleProps: /CARET|MATCH_IDENTIFIER_BG|SELECTED_LINE_BG|HIDDEN|COMMENT|RESERVED|KEYWORD|IDENTIFIER|REG_EXP|PUNCTUATION|NUMBER|STRING|DEFAULT/,
  // },
});
