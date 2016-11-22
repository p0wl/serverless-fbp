'use strict';

const AWS = require('aws-sdk');
const BbPromise = require('bluebird');
const shared = require('./src/shared');

const fbpGraph = require('.fbp.json'); // eslint-disable-line import/no-unresolved

// eslint-disable-next-line consistent-return
const fromSnsSubscription = handler => (event, context, callback) => {
  let message;
  try {
    message = event.Records[0].Sns.Message;
  } catch (e) {
    console.log('Could not find sns message content in event: ', JSON.stringify(event)); // eslint-disable-line no-console
    return null;
  }
  return handler(JSON.parse(message), context, callback);
};

function snsArnFromLambdaArn(arn, topic) {
  const parseAccountId = /arn:aws:lambda:(.+?):(.+?):/;
  const region = parseAccountId.exec(arn)[1];
  const accountId = parseAccountId.exec(arn)[2];

  return `arn:aws:sns:${region}:${accountId}:${topic}`;
}

const publishToSnsTopics = (topics, context, callback) => (err, result) => {
  const sns = new AWS.SNS();
  const message = JSON.stringify(result);

  if (!context.invokedFunctionArn) { // Invoked local
    console.log(`Invoked local - would publish to ${topics.join(',')}, but stopping here.`); // eslint-disable-line no-console
    return;
  }

  BbPromise.each(topics, (topic) => {
    const params = {
      Message: message,
      TopicArn: snsArnFromLambdaArn(context.invokedFunctionArn, topic),
    };

    return sns.publish(params, (error, data) => { // eslint-disable-line no-unused-vars
      if (error) {
        callback(error);
      }
    });
  }).then(() => callback(null, { message: 'Message successfully published to SNS topics' }));
};

module.exports.register = (component, handler) => (event, context, callback) => {
  const connections = shared.connectionsForComponent(fbpGraph, component);

  let enrichedHandler = handler;
  if (connections.input.length > 0) {
    enrichedHandler = fromSnsSubscription(handler);
  }

  let enrichedCallback = callback;
  if (connections.output.length > 0) {
    const topics = connections.output.map(output => shared.snsTopicForComponent(output));
    enrichedCallback = publishToSnsTopics(topics, context, callback);
  }

  return enrichedHandler(event, context, enrichedCallback);
};
