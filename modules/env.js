const process = require('process');

function setupEnv() {
    dotenv.config({ path: './.env' });

    return {
        defaultTopic: process.env.TOPIC || 'default-topic-unique-string',
    }
}

module.exports = setupEnv;