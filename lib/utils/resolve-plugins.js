'use strict';

const path = require('path');
const R = require('ramda');
const loaderUtils = require('loader-utils');
const resolve = require('resolve');

function resolvePlugin(plugin) {
  let result;
  try {
    result = resolve.sync(plugin, {
      basedir: process.cwd(),
    }).replace(/\\/g, '/');
  } catch (e) {} // eslint-disable-line no-empty
  return result;
}

module.exports = function resolvePlugins(plugins, moduleName) {
  return plugins.map((plugin) => {
    const snippets = plugin.split('?');
    const pluginName = path.join(snippets[0], 'lib', moduleName);
    const pluginQuery = loaderUtils.parseQuery(snippets[1] ? `?${snippets[1]}` : '');
    const resolvedPlugin = resolvePlugin(pluginName);
    if (!resolvedPlugin) {
      return false;
    }
    return [
      resolvedPlugin,
      pluginQuery,
    ];
  }).filter(R.identity);
};
