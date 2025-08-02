const RPC = require('@hyperswarm/rpc');
const {CustomEvent} = require('../custom-events/setup.js');
const { EventType } = require('../custom-events/constants.js');
const { RPC_POINTS } = require('./constants.js');
const { DEFAULT_SIGN_SEPARATOR } = require('../safe/constants.js');


class RpcServer {
    constructor(store, safe) {
        this.safe = safe;
        this.store = store;
        this.server = null;
    }

    async setup(seed) {
        const rpc = new RPC({seed});
        this.server = rpc.createServer();
        
        await this.server.listen();
        this.setupRpcEndpoints();
        console.log('RPC server publicKey:', this.server.publicKey.toString('hex'));
    }

    setupRpcEndpoints() {
        this.server.respond(RPC_POINTS.ECHO, req => {
            console.log('[RPC] echo');
            return req;
        });

        this.server.respond(RPC_POINTS.PROPOSE, req => {
            console.log('[RPC] propose', req.toString());
        
            try {
                const data = JSON.parse(req.toString())
                console.log('proposal:', data);
                
                CustomEvent.emit(EventType.PROPOSE_TXN, data);
                
                return Buffer.from('OK!');
            } catch {}
        
            return Buffer.from('FAIL!');
        });
        
        this.server.respond(RPC_POINTS.SIGN_STATUS, req => {
            console.log('[RPC] sign_status', req.toString());
        
            try {
                const data = JSON.parse(req.toString())
                console.log('sign_status data parsed:', data);
        
                const status = this.safe.getStatus(data.txnHash);
                
                return Buffer.from(status);
            } catch {}
        
            return Buffer.from('FAIL!');
        });
        
        this.server.respond(RPC_POINTS.SIGS_RETRIEVE, req => {
            console.log('[RPC] ' + RPC_POINTS.SIGS_RETRIEVE, req.toString());
        
            try {
                const data = JSON.parse(req.toString())
                console.log('sign_status data parsed:', data);
        
                const sigsStr = this.safe.getSignaturesJoined(data.txnHash, data.sep || DEFAULT_SIGN_SEPARATOR);
                
                return Buffer.from(sigsStr);
            } catch {}
        
            return Buffer.from('FAIL!');
        });
    }
}

module.exports = RpcServer;