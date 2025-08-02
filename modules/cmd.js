const {Command} = require('commander');


class CmdArgs {
    constructor() {
        const cmd = new Command()
        cmd
            .option('-p, --pvt-key <server pvt key>', 'Private Key of the Server')
            .option('-c, --connect <server pub key>', 'Public Key of Server to connect to')
            .option('-k, --rmt-core-feed-pub-key <hypercore remote public key>', 'HyperCore remote public key to use')
            .parse(process.argv);
        this.args = cmd.opts();
    }

    get pvtKey() {
        return this.args.pvtKey;
    }

    get rmtCoreFeedPubKey() {
        return this.args.rmtCoreFeedPubKey;
    }
    
}

module.exports = CmdArgs;