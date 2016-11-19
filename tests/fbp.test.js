let CONNECTIONS = {};
const connections = (input = [], output = []) => {
  CONNECTIONS = Object.assign(connections, { input, output });
};

let publishMock = jest.fn();

jest.mock('../.fbp.json', () => ({}), { virtual: true });
jest.mock('../src/shared', () => ({
  connectionsForComponent: () => CONNECTIONS,
  snsTopicForComponent: component => `fbp-${component}`,
}));
jest.mock('aws-sdk', () => ({
  SNS: function SNS() {
    this.publish = publishMock;
  },
}));

const fbp = require('../fbp');

test('register should not wrap if component is not used in graph', () => {
  connections([], []);

  const handler = jest.fn((event, context, callback) => {
    expect(event).toEqual({ some: 'event' });
    callback(null, { some: 'return value' });
  });

  publishMock = () => { throw new Error('should not have been called'); };

  const component = fbp.register('somecomponent', handler);

  component({ some: 'event' }, { invokedFunctionArn: 'arn:aws:lambda:eu-region-1:accountid:functionName' }, () => null);
  expect(handler).toHaveBeenCalled();
});

test('event value should be extracted from sns event if component is used in graph', () => {
  connections(['some-input-for-component'], []);

  const expectedEvent = { some: 'event' };
  const snsEvent = { Records: [{ Sns: { Message: JSON.stringify(expectedEvent) } }] };
  const handler = jest.fn((event) => {
    expect(event).toEqual(expectedEvent);
  });
  const component = fbp.register('somecomponent', handler);

  component(snsEvent);
  expect(handler).toHaveBeenCalled();
});

test('result should be sent to all outputs', (done) => {
  connections([], ['output1', 'output2']);
  const expectedParams = [
    { Message: '{"toThe":"sns-topics!"}', TopicArn: 'arn:aws:sns:eu-region-1:accountid:fbp-output1' },
    { Message: '{"toThe":"sns-topics!"}', TopicArn: 'arn:aws:sns:eu-region-1:accountid:fbp-output2' },
  ];

  publishMock = (params) => {
    expect(params).toEqual(expectedParams[0]);
    expectedParams.shift();
  };

  const component = fbp.register('somecomponent', (event, context, callback) => {
    callback(null, { toThe: 'sns-topics!' });
  });
  component({ ping: 1 }, { invokedFunctionArn: 'arn:aws:lambda:eu-region-1:accountid:functionName' }, done);
});
