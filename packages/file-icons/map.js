// @ts-check
const prefix = require('./prefix');

const fileMap = {
  'package.json': 'node',
  'package-lock.json': 'node',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',

  '.gitattributes': 'git',
  '.gitignore': 'git',
  '.gitkeep': 'git',

  '.editorconfig': 'editorconfig',
  '.browserlist': 'browserlist',
  '.browserlistrc': 'browserlist',
  '.stylelint': 'stylelint',
  '.stylelintrc': 'stylelint',
  '.stylelintignore': 'stylelint',
  '.eslintrc': 'eslint',
  '.yarnrc': 'yarn',
  '.npmrc': 'npm',
  '.npmignore': 'npm',
  '.prettierrc': 'prettier',

  'vite.config.js': 'vite',
  'vite.config.ts': 'vite',
  'rollup.config.js': 'rollup',
  'rollup.config.ts': 'rollup',
  'webpack.config.js': 'webpack',
  'webpack.config.ts': 'webpack',
  'tailwind.config.js': 'tailwind',
  'tailwind.config.ts': 'tailwind',
  'babel.config.js': 'babel',
  'babel.config.ts': 'babel',
  'jest.config.js': 'jest',
  'jest.config.ts': 'jest',

  '.env': 'env',
  // @TODO: Support for endsWith
  // '.env.*': 'env',

  '*.module.ts': 'angular',
  '*.component.ts': 'angular',

  '*.webpack.json': 'webpack',

  '*.story.js': 'storybook',
  '*.stories.js': 'storybook',
  '*.story.jsx': 'storybook',
  '*.stories.jsx': 'storybook',
  '*.story.ts': 'storybook',
  '*.stories.ts': 'storybook',
  '*.story.tsx': 'storybook',
  '*.stories.tsx': 'storybook',

  '*.jsx': 'jsx',
  '*.js': 'js',
  '*.mjs': 'js',
  '*.cjs': 'js',

  '*.d.ts': 'ts-d',
  '*.ts': 'ts',
  '*.mts': 'ts',
  '*.cts': 'ts',

  '*.marko': 'marko',
  '*.res': 'rescript',
  '*.riot': 'riot',
  '*.svelte': 'svelte',
  '*.vue': 'vue',

  '*.html': 'html',
  '*.css': 'css',
  '*.sass': 'sass',
  '*.scss': 'sass',
  '*.less': 'less',
  '*.stylus': 'stylus',

  '*.graphql': 'graphql',
  '*.gql': 'graphql',
  '*.toml': 'toml',
  '*.json': 'json',
  '*.yaml': 'yaml',
  '*.yml': 'yaml',
  '*.md': 'md',
  '*.mdx': 'mdx',
  '*.svg': 'svg',

  '*.rs': 'rust',
};

/**
 * @param {string} fileName
 * @returns {string}
 */
function mapFile(fileName) {
  for (const query in fileMap) {
    const isDynamic = query.indexOf('*') === 0;

    if (!isDynamic && query === fileName) {
      return fileMap[query];
    }

    if (!isDynamic) {
      continue;
    }

    const endMatch = query.substring(1);

    if (fileName.endsWith(endMatch)) {
      return fileMap[query];
    }
  }

  return 'default';
}

const dirMap = {
  'directory-open': 'directory-open',
};

/**
 * @param {string} dirName
 * @returns {string}
 */
function mapDirectory(dirName) {
  for (const query in dirMap) {
    const isDynamic = query.indexOf('*') === 0;

    if (!isDynamic && query === dirName) {
      return dirMap[dirName];
    }

    if (!isDynamic) {
      continue;
    }

    const endMatch = query.substring(1);

    if (dirName.endsWith(endMatch)) {
      return dirMap[dirName];
    }
  }

  return 'directory';
}

/**
 * @type {Record<string, (name: string) => string>}
 */
module.exports = {
  mapFile: (name) => `${prefix}-${mapFile(name)}`,
  mapDirectory: (name) => `${prefix}-${mapDirectory(name)}`,
};
