serverless-fbp
====================
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

A Serverless plugin that allows lambda function composition via [Flow Based Programming](https://en.wikipedia.org/wiki/Flow-based_programming).

**This is a proof of concept and far from production ready. Use at own risk. Any contributions welcome.**

## Flow Based Programming
> flow-based programming (FBP) is a programming paradigm that defines applications as networks of "black box" processes, which exchange data across predefined connections by message passing, where the connections are specified externally to the processes.

[Flow Based Programming at Wikipedia](https://en.wikipedia.org/wiki/Flow-based_programming)

## FBP and Serverless
Serverless provides a great abstraction over AWS Lambda infrastructure and allows painless deployment of Serverless applications. At the moment, Serverless is not providing methods for communication between functions ([Serverless Issue: Service Communication](https://github.com/serverless/serverless/issues/2484))

**This plugin is meant as inspiration on how service communication could be solved.**

FBP sees components as black boxes and information (data) flows between these. Connections are described externally. Thanks to these concepts, FBP components are highly reusable, independent and easily exchangeable, testable and rewritable. All of these are strengths that serverless applications could benefit from.

### Inter-function-communication via FBP

This plugin sets up communication between all functions according to a fbp-graph. 

All communication is handled by SNS topics.
The fbp-graph is parsed using [flowbased/fbp](https://github.com/flowbased/fbp), but a lot of fbp-features are not yet implemented.

## Setup

* Install via npm in the root of your Serverless service:
```
npm install --save-dev serverless-fbp
```

* Add the plugin to the `plugins` array in your Serverless `serverless.yml`:

```yml
plugins:
  - serverless-fbp
```

* Allow all lambda functions to publish to `fbp-*` sns topics

```yml
provider:
  iamRoleStatements:
    -  Effect: 'Allow'
       Action:
         - 'SNS:Publish'
       Resource:
         - arn:aws:sns:::fbp-*
```

* Define the name of your fbp-graph file:

```yml
custom:
  fbp: ./handler.fbp
```

## Usage

### 1. Creating the fbp-graph
After setting up this plugin, create the fbp-graph you want:

```fbp
# handler.fbp
Ping(ping) -> Logger(logger) 
``` 

In the graph, you can use any function that you defined in your serverless service as component (tl;dr fbp syntax: `Process(Component) -> Process(Component)`)

### 2. Register the handlers
Every function that is used in the fbp graph must be registered. To register a graph, wrap it with the `register` function:

```
const fbp = require('serverless-fbp');

module.exports.ping = fbp.register('ping', function (event, context, callback) { ... })
```

The first parameter of the `fbp.register` function is the name of the `component`, the second one is the lambda handler function.
Register wraps the handler but you do not need to change your lambda function definition. In fact, when you register a component that is not used in the fbp graph, `fbp.register` will not have any effect.

### 3. Deploy the functions

Run `serverless deploy` to deploy. The plugin will take care of setting up the sns-topics.

## Example
comming soon

## Limitations / Todo

Right now, the feature set is very limited. List of things that are not considered yet:

 * [ ] Port names
 * [ ] Multiple Information Packets (IPs) as result
 * [ ] Initial Information Packets (IIPs)
