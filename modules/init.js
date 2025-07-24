const setupEnv = require('./env.js');
const setupCmd = require('./cmd.js');

function initNode() {
    const env = setupEnv();
    const cmdOpts = setupCmd(env);

    return {
        env,
        cmdOpts
    }
}

module.exports = initNode;
