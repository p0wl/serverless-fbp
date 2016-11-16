const fs = require('fs');
const path = require('path');
const parseFbp = require('./parseFbp');

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
    const fbpOptions = this.serverless.service.custom.fbp;
    const fbpGraph = parseFbp.parse(fbpOptions);
    const inputs = parseFbp.inputs(fbpGraph);

    inputs.forEach((input) => {
      const funcDefinition = this.serverless.service.functions[input];
      if (!funcDefinition.events) {
        funcDefinition.events = [];
      }

      assertNoExistingSnsHandler(funcDefinition.events);

      funcDefinition.events.push({ sns: `fbp-${input}` });
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
