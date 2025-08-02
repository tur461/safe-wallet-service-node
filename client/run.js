const RPC = require('@hyperswarm/rpc');
const crypto = require('crypto');
const RPC_POINTS = {
    ECHO: 'echo',
    SIGN_STATUS: 'sign_status',
    PROPOSE: 'propose',
    SIGS_RETRIEVE: 'sigs_retrieve',
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node rpc-client.js <rpcPublicKeyHex> <endpoint> [payloadAsJSON]');
        process.exit(1);
    }

    const [publicKeyHex, endpoint, payloadJson = '{}'] = args;
    const publicKey = Buffer.from(publicKeyHex, 'hex');
    const rpc = new RPC();

    let payload;
    try {
        payload = Buffer.from(JSON.stringify(JSON.parse(payloadJson)));
    } catch (err) {
        console.error('Invalid JSON payload:', err.message);
        process.exit(1);
    }

    console.log(`Calling ${endpoint} with payload:`, payload.toString());

    try {
        const response = await rpc.request(publicKey, endpoint, payload, { timeout: 5000 });
        console.log('Response:', response.toString());
    } catch (err) {
        console.error('RPC request failed:', err.message);
    } finally {
        rpc.destroy();
    }
}

main();