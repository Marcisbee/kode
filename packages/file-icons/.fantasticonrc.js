const prefix = require('./prefix');

module.exports = {
  inputDir: './icons', // (required)
  outputDir: './dist', // (required)
  normalize: false,
  prefix,
  fontTypes: ['woff2'],
  assetTypes: ['css', 'html'],
  templates: {
    css: './templates/css.hbs'
  },
  // fontsUrl: '/static/fonts',
  // formatOptions: {
  //   // Pass options directly to `svgicons2svgfont`
  //   // woff: {
  //   //   // Woff Extended Metadata Block - see https://www.w3.org/TR/WOFF/#Metadata
  //   //   metadata: '...'
  //   // },
  //   css: {

  //   },
  // },
  // Use a custom Handlebars template
  // templates: {
  //   css: './my-custom-tp.css.hbs'
  // },
  // pathOptions: {
  //   ts: './src/types/icon-types.ts',
  //   json: './misc/icon-codepoints.json'
  // },
  // codepoints: {
  //   'chevron-left': 57344, // decimal representation of 0xe000
  //   'chevron-right': 57345,
  //   'thumbs-up': 57358,
  //   'thumbs-down': 57359
  // },
  // Customize generated icon IDs (unavailable with `.json` config file)
  // getIconId: ({
  //   basename, // `string` - Example: 'foo';
  //   relativeDirPath, // `string` - Example: 'sub/dir/foo.svg'
  //   absoluteFilePath, // `string` - Example: '/var/icons/sub/dir/foo.svg'
  //   relativeFilePath, // `string` - Example: 'foo.svg'
  //   index // `number` - Example: `0`
  // }) => [index, basename].join('_') // '0_foo'
};
