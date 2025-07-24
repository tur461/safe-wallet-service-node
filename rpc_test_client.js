const RPC = require('@hyperswarm/rpc');

if (process.argv.length < 4) {
    console.log('Usage: node rpc-client.js <serverPublicKeyHex> <method> [message]');
    process.exit(1);
}

(async () => {
    const serverKey = Buffer.from(process.argv[2], 'hex');
    const method = process.argv[3];
    const message = process.argv[4] || 'hello world';

    const rpc = new RPC();
    const client = rpc.connect(serverKey);

    // Make an RPC request
    const response = await client.request(method, Buffer.from(message));
    console.log(`RPC "${method}" response:`, response.toString());
})();