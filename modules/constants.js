const RPC_SEED = '4827209c513d2f86d0930f70bfb612954793bba70e1a1786d83e16b6ecc9c109';

const IPC = {
    CMD: {
        SIGN: 'SIGN',
    },
    TYPE: {
        ED25519: 'ed25519',
        SECP256K1: 'secp256k1',
    }
}

const DEFAULTS = {
    CORE_STORE_PATH: './coreStore',
    SOCKET_FILE: '/tmp/sign_service.sock',
    PROVIDER_URL: 'http://localhost:8545',
    RPC_TOPIC: 'default-rpc-topic-unique-string',
    SWARM_TOPIC: 'default-swarm-topic-unique-string',
}

module.exports = {
    IPC,
    RPC_SEED,
    DEFAULTS,
}