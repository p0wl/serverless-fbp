const parseFbp = require('./parseFbp');
const fbpGraph = require('.fbp.json'); // eslint-disable-line import/no-unresolved

module.exports.settings = componentName =>
    parseFbp.connectionsForComponent(fbpGraph, componentName);
