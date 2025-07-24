const initNode = require('./modules/init-node.js');
const setupSwarm = require('./modules/p2p/swarm.js');
const setupSwarmRPC = require('./modules/p2p/swarm-rpc.js');
const setupStoreAndDB = require('./modules/p2p/storage.js');
const {generateEd25519KeyPair} = require('./modules/crypt.js');

async function main() {
    const {env, cmdOpts} = initNode();
    
    const pvtKey = cmdOpts.pvtKey;
    
    // const rpcTopic = env.rpcTopic;
    const swarmTopic = env.swarmTopic;
    
    const keyPair = generateEd25519KeyPair(pvtKey);

    const coreStorePath = env.coreStorePath + '/' + keyPair.publicKey.toString('hex');
    
    const base = await setupStoreAndDB(coreStorePath);

    const rpc = await setupSwarmRPC(keyPair.publicKey, base.db);

    const swarm = await setupSwarm(keyPair, swarmTopic, cmdOpts, { 
        store: base.store 
    });
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
