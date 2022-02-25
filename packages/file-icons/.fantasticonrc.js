const prefix = require('./prefix');

module.exports = {
  inputDir: './icons', // (required)
  outputDir: './dist', // (required)
  normalize: true,
  prefix,
  fontTypes: ['woff2'],
  assetTypes: ['css', 'html'],
  templates: {
    css: './templates/css.hbs'
  },
};
