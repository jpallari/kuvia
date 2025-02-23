const uglifycss = require('uglifycss');
const fs = require('node:fs/promises');
const resources = require('./resources');

const cssFile = resources.resourcePath('style.css');
const templateFile = resources.resourcePath('page.html');

async function readCssFile(options) {
  const contents = await fs.readFile(cssFile, { encoding: 'utf-8' });

  if (options['no-min']) {
    return contents;
  }

  return uglifycss.processString(contents);
}

function optionsToLocals(options) {
  return {
    pretty: options['no-min'],
    cssUrls: options.css || [],
    jsUrls: options.js || [],
  };
}

const placeholderRe = /\{\{\{([^}]+)\}\}\}/;

/**
 * @returns {string} options as HTML headers
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
 * @param {string} templateStr
 * @param {Object} options
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
 * Render the HTML page for Kuvia
 *
 * @param {() => Promise<string>} jsSource
 * @param {() => Promise<string[]>} listSource
 * @returns {Promise<string>}
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
