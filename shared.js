const componentFromProcess = (fbpGraph, process) => fbpGraph.processes[process].component;

module.exports.snsTopicForComponent = component => `fbp-${component}`;

module.exports.inputs = function inputs(fbpGraph) {
  return fbpGraph.connections.reduce((mem, connection) => {
    const targetComponent = componentFromProcess(fbpGraph, connection.tgt.process);

    if (mem.indexOf(targetComponent) === -1) {
      mem.push(targetComponent);
    }

    return mem;
  }, []);
};

module.exports.connectionsForComponent = (fbpGraph, component) =>
  fbpGraph.connections.reduce((mem, connection) => {
    const targetComponent = componentFromProcess(fbpGraph, connection.tgt.process);
    const sourceComponent = componentFromProcess(fbpGraph, connection.src.process);

    if (targetComponent === component) {
      mem.input.push(sourceComponent);
    }

    if (sourceComponent === component) {
      mem.output.push(targetComponent);
    }

    return mem;
  },
  { input: [], output: [] } // eslint-disable-line comma-dangle
);
