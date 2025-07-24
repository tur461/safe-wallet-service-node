const {Command} = require('commander');

function setupCmd(opts) {
    const program = new Command();
    program
        .option('-p, --pvt-key <server pvt key>', 'Private Key of the Server')
        .option('-c, --connect <server pub key>', 'Public Key of Server to connect to')
        .option('-t, --topic <topic>', 'Topic to use for communication', opts.defaultTopic)
        .option('-w, --web-server', 'Enable Web RPC server')
        .parse(process.argv);
    return program.opts();
}

module.exports = setupCmd;