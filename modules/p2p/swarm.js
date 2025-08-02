const Swarm = require('hyperswarm');
const { createHash } = require('crypto');
const { setupCustomEventListenersForSwarm } = require('./swarm-helpers');

class SwarmSetup {
    constructor() {
        this.swarm = null;
    }

    async init(opts) {
        console.log('keypair:', opts.keyPair);
        console.log('keypair:', opts.keyPair)
        this.swarm = new Swarm({
            keyPair: opts.keyPair
        });

    
        this.setupListeners(opts.store);

    
        console.log('Public Key:', this.swarm.keyPair.publicKey.toString('hex'));

    
        const topicBuffer = createHash('sha256').update(opts.topic).digest();
        console.log('Swarm initialized with topic:', topicBuffer.toString('hex'));

    
        const discovery = this.swarm.join(topicBuffer, { server: true, client: true });
        await discovery.flushed();
        await this.swarm.flush();

    
        console.log('Swarm is ready and listening for connections...');

    
        if (opts.connect) {
            const pubKeyBuffer = Buffer.from(opts.connect, 'hex');
            console.log('Swarm connecting to other peer..');
            this.swarm.joinPeer(pubKeyBuffer);
        }

        
        return this.swarm;
    }

    setupListeners(store) {
        console.log('[setupListeners]');
        this.swarm.on('connection', (sock, info) => {
            console.log('New connection!', info.publicKey.toString('hex').slice(0, 6), ' is INIT:', info.client);

            
            const replicationStream = store.replicate(info.client);

    
            sock.pipe(replicationStream).pipe(sock);

            
            setupCustomEventListenersForSwarm();

            
            sock.on('close', () => console.log('Stream closed'));
            sock.on('error', err => console.error('Error:', err));
        });
    }
}

module.exports = SwarmSetup;