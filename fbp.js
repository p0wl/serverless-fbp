'use strict';

const AWS = require('aws-sdk');
const BbPromise = require('bluebird');
const fbpGraphInstance = require('./instance.js');

const parseAccountId = /arn:aws:lambda:(.+?):(.+?):/;

function snsArnFromLambdaArn(arn, topic) {
  if (!arn) { // Invoked local
    return `fbp-local-${topic}`;
  }

  const region = parseAccountId.exec(arn)[1];
  const accountId = parseAccountId.exec(arn)[2];

  return `arn:aws:sns:${region}:${accountId}:${topic}`;
}

const publishToSnsTopics = (topics, context, callback) => (err, result) => {
  const sns = new AWS.SNS();
  const message = JSON.stringify(result);

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

const fromSnsSubscription = handler => (event, context, callback) => {
  try {
    const message = event.Records[0].Sns.Message;
    handler(JSON.parse(message), context, callback);
  } catch (e) {
    console.log('Could not find sns message content in event: ', JSON.stringify(event)); // eslint-disable-line no-console
  }
};

module.exports.register = (componentName, handler) => (event, context, callback) => {
  const settings = fbpGraphInstance.settings(componentName);

  let enrichedHandler = handler;
  if (settings.input.length > 0) {
    enrichedHandler = fromSnsSubscription(handler);
  }

  let enrichedCallback = callback;
  if (settings.output.length > 0) {
    const topics = settings.output.map(output => `fbp-${output}`);
    enrichedCallback = publishToSnsTopics(topics, context, callback);
  }

  return enrichedHandler(event, context, enrichedCallback);
};
