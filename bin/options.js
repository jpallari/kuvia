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

const parsedOptions = (() => {
  const shortOptions = {};
  const longOptions = {};
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

function renderHelp() {
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

function parseOptions(argvInput) {
  const options = {};
  const argv = [];
  let errorMessage;
  const args = [...argvInput];

  let arg;
  argloop: while ((arg = args.shift())) {
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
    switch (option.mod) {
      case 'single':
        if (!value) {
          value = args.shift();
        }
        options[option.long] = value;
        break;
      case 'multi':
        if (!value) {
          value = args.shift();
        }
        if (!options[option.long]) {
          options[option.long] = [];
        }
        options[option.long].push(value);
        break;
      case 'flag':
        if (value === 'false') {
          flag = false;
        } else if (value && value !== 'true') {
          errorMessage = `Unexpected parameter "${value}". Expected "true" or "false".`;
          break argloop;
        }
        options[option.long] = flag;
        break;
      default:
        throw new Error(`Unexpected option modifier: ${option.mod}`);
    }
  }

  return { options, argv, errorMessage };
}

function getOptions(args) {
  if (!args) {
    args = process.argv.slice(2);
  }
  const { options, argv, errorMessage } = parseOptions(args);
  if (errorMessage) {
    console.error(errorMessage);
    process.exit(1);
  }
  if (options.help) {
    console.error(renderHelp());
    process.exit(1);
  }

  return { ...options, files: argv };
}

exports.parseOptions = parseOptions;
exports.renderHelp = renderHelp;
exports.getOptions = getOptions;
