const dotenv = require('dotenv');
const RPCClient = require("./rpc");
const Safe = require('./safe');

dotenv.config('../.env');

if (process.argv.length < 4) {
    console.log('Usage: node rpc-client.js <serverPublicKeyHex> <method> [message]');
    process.exit(1);
}

(async () => {
    const serverKey = Buffer.from(process.argv[2], 'hex');
    const method = process.argv[3];
    const txHash = process.argv[4];

    const rpc = new RPCClient({pubKey: serverKey});
    rpc.init();

    const safe = new Safe({
        rpc,
        keys: [
            process.env.PVT_KEY_1,
            process.env.PVT_KEY_2,
            process.env.PVT_KEY_3
        ],
        threshold: 2
    });

    switch (method) {
        case 'prop':
            await safe.propose();
            break;
        case 'stat':
            const stat = await rpc.getStatus(txHash);
            console.log('STAT:', stat);
            break;
        case 'ret':
            const sig = await rpc.getSignatures(txHash);
            console.log('SIG:', sig);
            break;
    }
    
    process.exit(0)
})();