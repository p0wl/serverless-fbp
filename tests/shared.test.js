const shared = require('../src/shared');
const fbpGraph = require('./fbp-graph.json');

test('naming for sns topics is fbp-component', () => {
  expect(shared.snsTopicForComponent('somecomponent')).toBe('fbp-somecomponent');
});

test('inputs should return a list of components that recieve IPs from processes', () => {
  const inputs = shared.inputs(fbpGraph);

  expect(inputs).toEqual(['hello', 'logger']);
});

test('connections should return inputs and outputs for each component', () => {
  expect(shared.connectionsForComponent(fbpGraph, 'hello'))
    .toEqual({ input: ['ping'], output: ['logger'] });

  expect(shared.connectionsForComponent(fbpGraph, 'ping'))
    .toEqual({ input: [], output: ['hello', 'logger'] });

  expect(shared.connectionsForComponent(fbpGraph, 'logger'))
    .toEqual({ input: ['ping', 'hello'], output: [] });
});
