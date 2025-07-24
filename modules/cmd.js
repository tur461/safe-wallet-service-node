const {Command} = require('commander');

function setupCmd(opts) {
    const program = new Command();
    program
        .option('-p, --pvt-key <server pvt key>', 'Private Key of the Server')
        .option('-c, --connect <server pub key>', 'Public Key of Server to connect to')
        .option('-k, --rmt-core-feed-pub-key <hypercore remote public key>', 'HyperCore remote public key to use')
        .parse(process.argv);
    return program.opts();
}

module.exports = setupCmd;