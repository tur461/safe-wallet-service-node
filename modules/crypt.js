const crypto = require('hypercore-crypto')

function generateEd25519KeyPair(pvtKey) {
    // HyperSwarm generates and uses a keyPair using ed25519 curve
    // but the pvt key we are using here is secp256k1 (Ethereum curve)
    // so we will use it just as a seed to generate a keyPair
    // and to keep it deterministic always!
    
    const pvtKeyBuffer = Buffer.from(pvtKey, 'hex');
    const keyPair = crypto.keyPair(pvtKeyBuffer)

    return keyPair;
}

module.exports = {
    generateEd25519KeyPair
};
