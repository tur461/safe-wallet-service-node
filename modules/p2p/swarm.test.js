const { test, expect } = require('@jest/globals');
const SwarmSetup = require('./swarm');
const { createHash } = require('crypto');   

describe('SwarmSetup', () => {
    it('should generate a public key', async () => {
        const sw = new SwarmSetup();
        const opts = {
            keyPair: {
                publicKey: '0x1234567890abcdef'
            },
            store: {
                replicate() {
                    return {
                        pipe() {}
                    };
                }
            },
            topic: 'test'
        };
        const swarm = await sw.init(opts);
        expect(swarm.keyPair.publicKey).toEqual(Buffer.from(opts.keyPair.publicKey, 'hex'));
    });

    it('should generate a topic', async () => {
        const sw = new SwarmSetup();
        const opts = {
            keyPair: {
                publicKey: '0x1234567890abcdef'
            },
            store: {
                replicate() {
                    return {
                        pipe() {}
                    };
                }
            },
            topic: 'test'
        };
        const swarm = await sw.init(opts);
        expect(swarm.topic).toEqual(createHash('sha256').update(opts.topic).digest());
    });

    it('should generate a discovery', async () => {
        const sw = new SwarmSetup();
        const opts = {
            keyPair: {
                publicKey: '0x1234567890abcdef'
            },
            store: {
                replicate() {
                    return {
                        pipe() {}
                    };
                }
            },
            topic: 'test'
        };
        const swarm = await sw.init(opts);
        expect(swarm.discovery).toEqual(swarm.join(swarm.topic, { server: true, client: true }));
    });
});