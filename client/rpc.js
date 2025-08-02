const RPC = require('@hyperswarm/rpc');
const { ACTION } = require('./constants');

class RPCClient {
    constructor(opts) {
        this.client = null;
        this.serverKey = opts.pubKey;
    }

    init() {
        const rpc = new RPC();
        this.client = rpc.connect(this.serverKey);    
    }

    async propose(txnHash) {
        return await this.act(ACTION.PROPOSE, txnHash);
    }
    
    async getStatus(txnHash) {
        return await this.act(ACTION.STATUS, txnHash);
    }
    
    async getSignatures(txnHash) {
        
        return await this.act(ACTION.RETRIEVE, txnHash);
    }

    async act(action, txnHash) {
        console.log('[RPC] act', action, txnHash);
        const response = await this.client.request(action, Buffer.from(txnHash));
        console.log(`RPC "act" response:`, response.toString());
        return response
    }   

}

module.exports = RPCClient;