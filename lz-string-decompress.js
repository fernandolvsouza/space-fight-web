#! /usr/bin/env node
var lzString = require('lz-string');
var fs = require('fs');

if (process.argv.length < 3) {
  console.error('Usage: lz-string <input_file>');
  process.exit(1);
}

console.log(lzString.decompress(fs.readFileSync(process.argv[2], {
  encoding: 'utf8',
})));

