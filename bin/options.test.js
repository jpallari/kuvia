const { parseOptions } = require('./options');

test('parse image scanning options', () => {
  const args = [
    '-o',
    'output.html',
    '--dir=dir1',
    '-d',
    'dir2',
    '-r',
    '-t',
    'jpeg',
    '-J',
    'extra.js',
    '-C',
    'extra.css',
    'file1.jpg',
    'file2.jpg',
  ];
  const output = {
    options: {
      output: 'output.html',
      dir: ['dir1', 'dir2'],
      recursive: true,
      types: 'jpeg',
      js: ['extra.js'],
      css: ['extra.css'],
    },
    argv: ['file1.jpg', 'file2.jpg'],
  };
  expect(parseOptions(args)).toMatchObject(output);
});
