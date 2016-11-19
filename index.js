const fs = require('fs');
const path = require('path');
const fbp = require('fbp');
const shared = require('./shared');

function assertNoExistingSnsHandler(input, events, topic) {
  if (events.some(event => event.sns === topic)) {
    throw new Error(`Cannot add ${topic} sns-topic, because it is already declared in your serverless service definition. Please remove it from serverless.yml. Serverless-fbp will set it up automatically\n\n\tService: ${input}\n\tEvent: ${topic}`);
  }
}

class ServerlessFbp {
  constructor(serverless) {
    this.serverless = serverless;
    this.hooks = {
      'before:deploy:initialize': this.beforeDeployInit.bind(this),
      'after:deploy:deploy': this.afterDeployDeploy.bind(this),
    };
  }

  beforeDeployInit() {
    const fbpFileName = this.serverless.service.custom.fbp;
    const fileContent = fs.readFileSync(path.resolve(fbpFileName), 'utf8');
    const fbpGraph = fbp.parse(fileContent);
    const inputs = shared.inputs(fbpGraph);

    inputs.forEach((input) => {
      const funcDefinition = this.serverless.service.functions[input];
      if (!funcDefinition.events) {
        funcDefinition.events = [];
      }

      const snsTopic = shared.snsTopicForComponent(input);
      assertNoExistingSnsHandler(input, funcDefinition.events, snsTopic);

      funcDefinition.events.push({ sns: snsTopic });
    });

    const fbpGraphFile = path.join(this.serverless.config.servicePath, './.fbp.json');
    fs.writeFileSync(fbpGraphFile, JSON.stringify(fbpGraph));
  }

  afterDeployDeploy() {
    const fbpGraphFile = path.join(this.serverless.config.servicePath, './.fbp.json');
    fs.unlinkSync(fbpGraphFile);
  }
}

module.exports = ServerlessFbp;
