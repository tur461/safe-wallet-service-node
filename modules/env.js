const dotenv = require('dotenv');
const process = require('process');
const {RPC_SEED, DEFAULTS} = require('./constants.js');

class Env {
    constructor() {
        dotenv.config({ path: './.env' });
    }

    get rpcTopic() {
        return process.env.RPC_TOPIC || DEFAULTS.RPC_TOPIC;
    }

    get swarmTopic() {
        return process.env.SWARM_TOPIC ||  DEFAULTS.SWARM_TOPIC;
    }

    get sockPath() {
        return process.env.SOCKET_FILE || DEFAULTS.SOCKET_FILE;
    }

    get providerUrl() {
        return process.env.PROVIDER_URL || DEFAULTS.PROVIDER_URL;
    }

    get coreStorePath() {
        return process.env.CORE_STORE_PATH || DEFAULTS.CORE_STORE_PATH;
    }

}

module.exports = Env;