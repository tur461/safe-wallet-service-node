const dotenv = require('dotenv');
const process = require('process');
const {RPC_SEED} = require('./constants.js');

function setupEnv() {
    dotenv.config({ path: './.env' });

    return {
        coreStorePath: process.env.CORE_STORE_PATH || './coreStore',
        rpcTopic: process.env.RPC_TOPIC || 'default-rpc-topic-unique-string',
        swarmTopic: process.env.SWARM_TOPIC || 'default-swarm-topic-unique-string',
    }
}

module.exports = setupEnv;