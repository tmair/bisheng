'use strict';

const fs = require('fs');
const path = require('path');
const R = require('ramda');

function ensureToBeArray(maybeArray) {
  return Array.isArray(maybeArray) ?
    maybeArray : [maybeArray];
}

function isDirectory(filename) {
  return fs.statSync(filename).isDirectory();
}

function isMDFile(filename) {
  const ext = path.extname(filename);
  return !isDirectory(filename) && ext === '.md';
}

function findMDFile(source) {
  return R.pipe(
    R.filter(R.either(isDirectory, isMDFile)),
    R.chain((filename) => {
      if (isDirectory(filename)) {
        const subFiles = fs.readdirSync(filename)
                .map((subFile) => path.join(filename, subFile));
        return findMDFile(subFiles);
      }
      return [filename.replace(/\\/g, '/')];
    })
  )(source);
}

const rxSep = new RegExp(`[/.]`);
function filesToTreeStructure(files) {
  return files.reduce((filesTree, filename) => {
    const propLens = R.lensPath(filename.replace(/\.md$/i, '').split(rxSep));
    return R.set(propLens, filename, filesTree);
  }, {});
}

function stringifyObject(obj, depth) {
  const indent = '  '.repeat(depth);
  const kvStrings = R.pipe(
    R.toPairs,
    /* eslint-disable no-use-before-define */
    R.map((kv) => `${indent}  '${kv[0]}': ${stringify(kv[1], depth + 1)},`)
    /* eslint-enable no-use-before-define */
  )(obj);
  return kvStrings.join('\n');
}

function stringify(node, depth) {
  const indent = '  '.repeat(depth);
  return R.cond([
    [(n) => typeof n === 'object', (obj) =>
     `{\n${stringifyObject(obj, depth)}\n${indent}}`,
    ],
    [R.T, (filename) => `require('${path.join(process.cwd(), filename).replace(/\\/g, '/')}')`],
  ])(node);
}

exports.generate = R.useWith((source) => {
  const mds = findMDFile(source);
  const filesTree = filesToTreeStructure(mds);
  return filesTree;
}, [ensureToBeArray]);

exports.stringify = (filesTree) =>
  stringify(filesTree, 0);
