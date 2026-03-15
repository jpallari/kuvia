const csso = require('csso');
const fs = require('node:fs/promises');
const resources = require('./resources');

const cssFile = resources.resourcePath('style.css');
const templateFile = resources.resourcePath('page.html');

/**
 * Reads and optionally minifies the CSS file.
 * @param {Object} options - Configuration options
 * @param {boolean} [options.noMin] - Whether to skip minification
 * @returns {Promise<string>} The CSS content, optionally minified
 */
async function readCssFile(options) {
  const contents = await fs.readFile(cssFile, { encoding: 'utf-8' });

  if (options.noMin) {
    return contents;
  }

  return csso.minify(contents).css;
}

const placeholderRe = /\{\{\{([^}]+)\}\}\}/;

/**
 * Converts options to HTML headers including stylesheets and scripts.
 * @param {Object} headerOptions - Options for generating HTML headers
 * @param {string} headerOptions.galleryCss - CSS content for the gallery
 * @param {string} headerOptions.galleryJs - JavaScript content for the gallery
 * @param {Array<string>} [headerOptions.cssUrls] - External CSS URLs
 * @param {string} [headerOptions.listJs] - JavaScript content for the image list
 * @param {Array<string>} [headerOptions.jsUrls] - External JavaScript URLs
 * @returns {string} HTML headers as a string
 */
function optionsToHtmlHeaders({
  galleryCss,
  galleryJs,
  cssUrls,
  listJs,
  jsUrls,
}) {
  const headers = [
    `<style>${galleryCss}</style>`,
    `<script type="application/javascript">${galleryJs}</script>`,
    ...(cssUrls || []).map(
      (cssUrl) => `<link ref='stylesheet' type='text/css' href='${cssUrl}' />`,
    ),
    ...(jsUrls || []).map(
      (jsUrl) =>
        `<script type='application/javascript' src='${jsUrl}'></script>`,
    ),
  ];
  if (listJs) {
    headers.push(`<script type='application/javascript'>${listJs}</script>`);
  }
  return headers.join('\n');
}

/**
 * Renders a template string by replacing placeholders with option values.
 * @param {string} templateStr - Template string with {{{placeholder}}} syntax
 * @param {Object} options - Object containing values for template placeholders
 * @returns {string} Rendered template with placeholders replaced
 * @throws {Error} When a template placeholder is not defined in options
 */
function renderTemplate(templateStr, options) {
  return templateStr.replace(placeholderRe, (match) => {
    const field = match.slice(3, -3); // remove surrounding curly braces
    const option = options[field];
    if (typeof option === 'undefined') {
      throw new Error(`Template placeholder '${match}' is not defined`);
    }
    return option;
  });
}

/**
 * Render the HTML page for Kuvia gallery.
 *
 * @param {Object} options - Configuration options
 * @param {Array<string>} [options.css] - External CSS URLs
 * @param {Array<string>} [options.js] - External JavaScript URLs
 * @param {boolean} [options.noMin] - Whether to skip minification
 * @param {function(): Promise<string>} jsSource - Function returning JavaScript source code
 * @param {function(): Promise<string>} listSource - Function returning image list JavaScript
 * @returns {Promise<string>} Complete HTML page as string
 */
async function renderPage(options, jsSource, listSource) {
  const [templateStr, galleryCss, galleryJs, listJs] = await Promise.all([
    fs.readFile(templateFile, { encoding: 'utf-8' }),
    readCssFile(options),
    jsSource(),
    listSource(),
  ]);

  const templateOpts = {
    galleryCss,
    galleryJs,
    listJs,
    cssUrls: options.css,
    jsUrls: options.js,
  };
  const htmlHeaders = optionsToHtmlHeaders(templateOpts);
  return renderTemplate(templateStr, { header: htmlHeaders });
}

module.exports = renderPage;
