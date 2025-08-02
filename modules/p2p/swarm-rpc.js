const RPC = require('@hyperswarm/rpc');
const {CustomEvent} = require('../custom-events/setup.js');
const { EventType } = require('../custom-events/constants.js');

async function setupSwarmRPC(seed, storage) {
    const rpc = new RPC({seed});
    const server = rpc.createServer();
    
    await server.listen();
    
    server.respond('echo', req => {
        console.log('[RPC] echo');
        return req;
    });
    
    server.respond('propose', req => {
        console.log('[RPC] propose', req.toString());

        try {
            const data = JSON.parse(req.toString())
            console.log('proposal:', data);
            
            // storage.put('propose_' + Date.now(), data)
            
            
            CustomEvent.emit(EventType.PROPOSE_TXN, data);
            
            return Buffer.from('OK!');
        } catch {}

        return Buffer.from('FAIL!');
    });
    
    server.respond('sign', req => {
        console.log('[RPC] sign', req.toString());

        try {
            const data = JSON.parse(req.toString())
            console.log('sign:', data);

            
            storage.put('sign_' + Date.now(), data)

            CustomEvent.emit(EventType.SIGN_TXN, data);
            
            return Buffer.from('OK!');
        } catch {}

        return Buffer.from('FAIL!');
    });
    
    server.respond('execute', req => {
        console.log('[RPC] execute', req.toString());

        try {
            const data = JSON.parse(req.toString())
            console.log('execute:', data);

            storage.put('execute_' + Date.now(), data)
            
            CustomEvent.emit(EventType.EXECUTE_TXN, data);
            
            return Buffer.from('OK!');
        } catch {}

        return Buffer.from('FAIL!');
    });
    
    console.log('RPC server publicKey:', server.publicKey.toString('hex'));
    
    return { rpc, server };
}

module.exports = setupSwarmRPC