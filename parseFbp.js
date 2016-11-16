

const fbp = require('fbp');
const path = require('path');
const fs = require('fs');

module.exports.parse = function parse(fileName) {
  const fileContent = fs.readFileSync(path.resolve(fileName), 'utf8');
  return fbp.parse(fileContent);
};

function componentFromName(fbpGraph, name) {
  return fbpGraph.processes[name].component;
}

module.exports.inputs = function inputs(fbpGraph) {
  return fbpGraph.connections.reduce((mem, connection) => {
    const targetComponent = componentFromName(fbpGraph, connection.tgt.process);

    if (mem.indexOf(targetComponent) === -1) {
      mem.push(targetComponent);
    }

    return mem;
  }, []);
};

module.exports.connectionsForComponent = function connectionsForComponent(fbpGraph, componentName) {
  return fbpGraph.connections.reduce((mem, connection) => {
    const targetComponent = componentFromName(fbpGraph, connection.tgt.process);
    const sourceComponent = componentFromName(fbpGraph, connection.src.process);

    if (targetComponent === componentName) {
      mem.input.push(sourceComponent);
    }

    if (sourceComponent === componentName) {
      mem.output.push(targetComponent);
    }

    return mem;
  }, { input: [], output: [] });
};
