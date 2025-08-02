const Storage = require('./modules/p2p/storage.js');
const SwarmSetup = require('./modules/p2p/swarm.js');
const RpcServer = require('./modules/p2p/swarm-rpc.js');
const Krypt = require('./modules/krypt.js');
const IpcEnclaveClient = require('./modules/ipc-client.js');
const SafeSDK = require('./modules/safe/safe-signing.js');
const Env = require('./modules/env.js');
const CmdArgs = require('./modules/cmd.js');

async function main() {
    const env = new Env();

    const cmdArgs = new CmdArgs()
    
    const rmtCoreFeedPubKey = cmdArgs.rmtCoreFeedPubKey;
    console.log('rmtCoreFeedPubKey:', rmtCoreFeedPubKey);
    
    const swarmTopic = env.swarmTopic;

    const socketPath = env.sockPath;

    const providerUrl = env.providerUrl;

    const ipc = new IpcEnclaveClient(socketPath);

    const krypt = new Krypt(ipc);
    
    const keyPair = await krypt.generateEd25519KeyPair();

    const pubKey = keyPair.publicKey.toString('hex');

    const coreStorePath = env.coreStorePath + '/' + keyPair.publicKey.toString('hex');
    
    const storage = new Storage(coreStorePath, rmtCoreFeedPubKey)

    await storage.setup();

    const safe = new SafeSDK({
        pubKey, // used as node_id
        ipc,
        db: storage,
        url: providerUrl,
        threshold: 2,
        ownersTotal: 3,
    });

    const rpcServer = new RpcServer(storage, safe);
    
    await rpcServer.setup(keyPair.publicKey);

    const ssObj = new SwarmSetup();
    
    await ssObj.init({
        keyPair,
        topic: swarmTopic,
        store: storage.store,
        connect: cmdArgs.connect, 
    })
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
