const crypto = require('hypercore-crypto')

class Krypt {
    constructor(ipc) {
        this.ipc = ipc;
    }

    async generateEd25519KeyPair() {
        // use IPC to get the keys
        const seed = await this.ipc.enclaveGenerateSeed();
        console.log('Enclave generated Seed:', seed);
        // for now:
        
        // HyperSwarm generates and uses a keyPair using ed25519 curve
        // but the pvt key we are using here is secp256k1 (Ethereum curve)
        // so we will use it just as a seed to generate a keyPair
        // and to keep it deterministic always!
        const seedBuffer = Buffer.from(seed, 'hex');
        const keyPair = crypto.keyPair(seedBuffer);

        return keyPair;
    }
}

module.exports = Krypt;
