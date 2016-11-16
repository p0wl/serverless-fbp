const fs = require('fs');
const path = require('path');
const fbp = require('fbp');
const shared = require('./shared');

function assertNoExistingSnsHandler(events) { // eslint-disable-line
  return true;
}

class DeployLogger {
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

      assertNoExistingSnsHandler(funcDefinition.events);

      funcDefinition.events.push({ sns: shared.snsTopicForComponent(input) });
    });

    const fbpGraphFile = path.join(this.serverless.config.servicePath, './.fbp.json');
    fs.writeFileSync(fbpGraphFile, JSON.stringify(fbpGraph));
  }

  afterDeployDeploy() {
    const fbpGraphFile = path.join(this.serverless.config.servicePath, './.fbp.json');
    fs.unlinkSync(fbpGraphFile);
  }
}

module.exports = DeployLogger;
