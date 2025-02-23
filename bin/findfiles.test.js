const findFiles = require('./findfiles');

test('no files to be found from non-image directory', () => {
  const options = {
    dir: ['bin'],
  };
  return expect(findFiles(options)).resolves.toStrictEqual([]);
});

test('given files to be included even when no files are found', () => {
  const options = {
    files: 'foobar.jpg',
    dir: ['bin'],
  };
  const expected = ['foobar.jpg'];
  return expect(findFiles(options)).resolves.toStrictEqual(expected);
});

test('raw patterns', () => {
  const options = {
    pattern: ['bin/findfiles.*', 'README.*'],
  };
  const expected = ['bin/findfiles.test.js', 'bin/findfiles.js', 'README.md'];
  return expect(findFiles(options)).resolves.toStrictEqual(expected);
});

test('directory search with custom file types', () => {
  const options = {
    dir: ['resources'],
    types: 'css,php',
  };
  const expected = ['resources/style.css', 'resources/imagelist.php'];
  return expect(findFiles(options)).resolves.toStrictEqual(expected);
});

test('prefix added to all files', () => {
  const options = {
    files: 'foobar.jpg',
    dir: ['resources'],
    types: 'css,php',
    pattern: ['README.*'],
    prefix: 'pfix/',
  };
  const expected = [
    'pfix/README.md',
    'pfix/resources/style.css',
    'pfix/resources/imagelist.php',
    'pfix/foobar.jpg',
  ];
  return expect(findFiles(options)).resolves.toStrictEqual(expected);
});
