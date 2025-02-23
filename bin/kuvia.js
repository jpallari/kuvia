#!/usr/bin/env node

const process = require('node:process');
const { getOptions } = require('./options');
const findFiles = require('./findfiles');
const renderFiles = require('./filelistrender');
const readJs = require('./jsreader');
const renderPage = require('./page');
const fileWriter = require('./writer');

const options = getOptions();
const filelist = findFiles.bind(null, options);
const renderedFiles = renderFiles.bind(null, options, filelist);
const js = readJs.bind(null, options);
const writer = fileWriter.bind(null, options);

renderPage(options, js, renderedFiles)
  .then(writer)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
