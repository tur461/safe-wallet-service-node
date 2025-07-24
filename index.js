const initNode = require('./modules/init-node.js');
const Storage = require('./modules/p2p/storage.js');
const setupSwarm = require('./modules/p2p/swarm.js');
const setupSwarmRPC = require('./modules/p2p/swarm-rpc.js');
const {generateEd25519KeyPair} = require('./modules/crypt.js');

async function main() {
    const {env, cmdOpts} = initNode();
    
    const pvtKey = cmdOpts.pvtKey;
    
    const rmtCoreFeedPubKey = cmdOpts.rmtCoreFeedPubKey;
    
    // const rpcTopic = env.rpcTopic;
    const swarmTopic = env.swarmTopic;
    
    const keyPair = generateEd25519KeyPair(pvtKey);


    const coreStorePath = env.coreStorePath + '/' + keyPair.publicKey.toString('hex');
    
    const storage = new Storage(coreStorePath, rmtCoreFeedPubKey)

    await storage.setup();

    const rpc = await setupSwarmRPC(keyPair.publicKey, storage);

    const swarm = await setupSwarm(keyPair, swarmTopic, cmdOpts, { 
        store: storage.store 
    });
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
