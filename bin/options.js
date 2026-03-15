const process = require('node:process');

const optionSpec = [
  ['h', 'help', 'Display this help.'],
  [
    'o',
    'output=ARG',
    'File to write the page to. Uses STDOUT if not specified.',
  ],

  // Image scanning
  ['d', 'dir=ARG+', 'Directories to scan for images.'],
  ['r', 'recursive', 'Recursively scan directories for images.'],
  [
    't',
    'types=ARG',
    'Comma separated list of file types to include in image scanning',
  ],
  ['e', 'pattern=ARG+', 'Patterns for scanning image files'],
  ['p', 'prefix=ARG', 'Prefix to add to each scanned file'],

  // Alternatives for image scanning
  ['j', 'json=ARG', 'Custom JSON source for images'],
  ['', 'php', 'Use PHP to load the list of images.'],

  // Customization
  ['J', 'js=ARG+', 'URLs to custom JavaScript files'],
  ['C', 'css=ARG+', 'URLs to custom CSS files'],
  ['', 'no-min', 'Disable minimization'],
];

const helpHeader = ['usage: kuvia [OPTIONS] [FILE ...]'].join('\n');

/**
 * @typedef {Object} OptionInfo
 * @property {string} short - Short option name
 * @property {string} long - Long option name  
 * @property {string} mod - Option modifier (flag, single, multi)
 */

/**
 * @typedef {Object} ParsedOptions
 * @property {{[key: string]: OptionInfo}} shortOptions - Dictionary of short options
 * @property {{[key: string]: OptionInfo}} longOptions - Dictionary of long options
 * @property {Array<Array<string>>} helpTexts - Help text entries
 */

/** @type {ParsedOptions} */
const parsedOptions = (() => {
  /** @type {{[key: string]: OptionInfo}} */
  const shortOptions = {};
  /** @type {{[key: string]: OptionInfo}} */
  const longOptions = {};
  /** @type {Array<Array<string>>} */
  const helpTexts = [];

  for (const [shortOptName, longOptSpec, optComment] of optionSpec) {
    const [longOptName, optMod] = longOptSpec.split('=');

    let mod;
    if (!optMod) {
      mod = 'flag';
    } else if (optMod.endsWith('+')) {
      mod = 'multi';
    } else {
      mod = 'single';
    }

    /** @type {OptionInfo} */
    const option = {
      short: shortOptName,
      long: longOptName,
      mod,
    };
    shortOptions[shortOptName] = option;
    longOptions[longOptName] = option;
    const optHelp = shortOptName
      ? ` -${shortOptName}, --${longOptSpec}`
      : `     --${longOptSpec}`;
    helpTexts.push([optHelp, ` ${optComment}`]);
  }

  return {
    shortOptions,
    longOptions,
    helpTexts,
  };
})();

/**
 * Renders the help text for the command line interface.
 * @returns {string} Formatted help text with options and descriptions
 */
function renderHelp() {
  /** @type {Array<number>} */
  const columnLengths = [];
  for (const row of parsedOptions.helpTexts) {
    for (let columnIndex = 0; columnIndex < row.length - 1; columnIndex += 1) {
      const text = row[columnIndex];
      columnLengths[columnIndex] = Math.max(
        columnLengths[columnIndex] || 0,
        text.length,
      );
    }
  }

  let helpText = helpHeader + '\n\nOptions: \n';
  for (const row of parsedOptions.helpTexts) {
    for (let i = 0; i < row.length; i += 1) {
      const text = row[i];
      helpText += text;
      if (i !== row.length - 1) {
        // not the last column
        const columnLength = columnLengths[i];
        const paddingLength = columnLength - text.length;
        helpText += ' '.repeat(paddingLength);
      }
    }
    helpText += '\n';
  }
  return helpText;
}

const shortOptPattern = /^-(\w[\w-]*)/;
const longOptPattern = /^--(\w[\w-]*)((?:=[^]*)?)$/;

/**
 * Convert a kebab-case string to camelCase string.
 * @param {string} str - The kebab-case string
 * @returns {string} The camelCase string
 */
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Parses command line arguments into options and positional arguments.
 * @param {string[]} argvInput - Array of command line arguments
 * @returns {{options: Object, argv: string[], errorMessage?: string}} Parsed options and arguments
 */
function parseOptions(argvInput) {
  /** @type {{[key: string]: any}} */
  const options = {};
  const argv = [];
  let errorMessage;
  const args = [...argvInput];

  let arg;
  argloop: while ((arg = args.shift())) {
    /** @type {OptionInfo} */
    let option;
    let match;
    let value;

    if ((match = shortOptPattern.exec(arg))) {
      // Short option
      const name = match[1];
      option = parsedOptions.shortOptions[name];
      if (!option) {
        errorMessage = `Invalid option: -${name}`;
        break argloop;
      }
    } else if ((match = longOptPattern.exec(arg))) {
      // Long option
      const name = match[1];
      option = parsedOptions.longOptions[name];
      if (!option) {
        errorMessage = `Invalid option: -${name}`;
        break argloop;
      }
      value = match[2].slice(1);
    } else if (arg === '--') {
      // Rest of the args
      argv.push(...args);
      break argloop;
    } else {
      // Positional args
      argv.push(arg);
      continue argloop;
    }

    let flag = true;
    const optionKey = kebabToCamel(option.long);
    switch (option.mod) {
      case 'single':
        if (!value) {
          value = args.shift();
        }
        options[optionKey] = value;
        break;
      case 'multi':
        if (!value) {
          value = args.shift();
        }
        if (!options[optionKey]) {
          options[optionKey] = [];
        }
        options[optionKey].push(value);
        break;
      case 'flag':
        if (value === 'false') {
          flag = false;
        } else if (value && value !== 'true') {
          errorMessage = `Unexpected parameter "${value}". Expected "true" or "false".`;
          break argloop;
        }
        options[optionKey] = flag;
        break;
      default:
        throw new Error(`Unexpected option modifier: ${option.mod}`);
    }
  }

  return { options, argv, errorMessage };
}

/**
 * Gets parsed options from command line arguments with error handling.
 * @param {string[]} [args] - Command line arguments (defaults to process.argv.slice(2))
 * @returns {Object} Parsed options object with files array
 */
function getOptions(args) {
  if (!args) {
    args = process.argv.slice(2);
  }
  const { options, argv, errorMessage } = parseOptions(args);
  if (errorMessage) {
    console.error(errorMessage);
    process.exit(1);
  }
  if ((/** @type {{help?: boolean}} */ (options)).help) {
    console.error(renderHelp());
    process.exit(1);
  }

  return { ...options, files: argv };
}

exports.parseOptions = parseOptions;
exports.renderHelp = renderHelp;
exports.getOptions = getOptions;
