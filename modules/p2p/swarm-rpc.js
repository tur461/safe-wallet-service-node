const RPC = require('@hyperswarm/rpc');

async function setupSwarmRPC(seed, db) {
    const rpc = new RPC({seed});
    const server = rpc.createServer();
    
    await server.listen();
    
    server.respond('echo', req => {
        console.log('[RPC] echo');
        return req;
    });
    
    server.respond('propose', req => {
        console.log('[RPC] propose');

        const data = JSON.parse(req.toString())
        console.log('proposal:', data);
        
        // put into autobase db
        // db.put('foo', { msg: "hello world", time: Date.now() })
        
        return 'OK'
    });
    
    console.log('RPC server publicKey:', server.publicKey.toString('hex'));
    
    return { rpc, server };
}

module.exports = setupSwarmRPC