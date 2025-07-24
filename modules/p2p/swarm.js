const Swarm = require('hyperswarm');
const { createHash } = require('crypto');
const { setupCustomEventListenersForSwarm } = require('./swarm-helpers.js');

async function setupSwarm(keyPair, topic, opts, extra) {
    const swarm = new Swarm({
        keyPair
    });

    setupSwarmListeners(swarm, extra);

    console.log('Public Key:', swarm.keyPair.publicKey.toString('hex'));

    const topicBuffer = createHash('sha256').update(topic).digest();
    console.log('Swarm initialized with topic:', topicBuffer.toString('hex'));

    const discovery = swarm.join(topicBuffer, { server: true, client: true });
    await discovery.flushed();
    await swarm.flush();

    console.log('Swarm is ready and listening for connections...');

    if (opts.connect) {
        const pubKeyBuffer = Buffer.from(opts.connect, 'hex');
        console.log('Swarm connecting to other peer..');
        swarm.joinPeer(pubKeyBuffer);
    }

    return swarm;
}

function setupSwarmListeners(swarm, extra) {
    swarm.on('connection', (sock, info) => {
        console.log('New connection!', info.publicKey.toString('hex').slice(0, 6));
        extra.store.replicate(sock);
        sock.write('Hello from my swarm node!');

        
        setupCustomEventListenersForSwarm(sock);
        
        sock.on('data', buf => handleSwarmSocketData(buf));

        sock.on('connect', () => console.log('Handshake complete!'));
        sock.on('close', () => console.log('Stream closed'));
        sock.on('error', err => console.error('Error:', err));
        sock.on('message', buf => console.log('Message received size:', buf.length));
    });
}

module.exports = setupSwarm;