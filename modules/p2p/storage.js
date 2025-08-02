const Corestore = require('corestore');
const Hyperbee = require('hyperbee');
const { CustomEvent } = require('../custom-events/setup.js');
const { EventType } = require('../custom-events/constants');

class Storage {
    constructor(path, key) {
        this.db = null;
        this.ownFeed = null;    // writable feed for this node
        this.remoteFeed = null; // read-only feed for replication
        this.store = null;
        this.stream = null;
        this.remoteCoreFeedPubKey = key; // remote feed public key
        this.coreStorePath = path;
        this.remoteDB = null;
    }

    async setup() {
        this.store = new Corestore(this.coreStorePath);
        await this.store.ready();

        this.store.on('feed', (feed) => {
            console.log('Replicating feed:', feed.key.toString('hex'));
        });
        // Always create/open a writable feed for this node
        this.ownFeed = this.store.get({ name: 'own-feed' });
        await this.ownFeed.ready();
        
        console.log('[ownFeed] discoveryKey:', this.ownFeed.discoveryKey.toString('hex'))
        console.log('Writable feed key (share if others should read it):', this.ownFeed.key.toString('hex'));

        // Local DB for writing
        this.db = new Hyperbee(this.ownFeed, {
            keyEncoding: 'utf-8',
            valueEncoding: 'json'
        });

        // If remote core key is provided, open it in read-only mode
        if (this.remoteCoreFeedPubKey) {
            this.remoteFeed = this.store.get({ key: Buffer.from(this.remoteCoreFeedPubKey, 'hex') });
            await this.remoteFeed.ready();
            this.remoteFeed.download();

            this.remoteDB = new Hyperbee(this.remoteFeed, {
                keyEncoding: 'utf-8',
                valueEncoding: 'json'
            });

            console.log('[remoteFeed] discoveryKey:', this.remoteFeed.discoveryKey.toString('hex'))
            
            this.remoteFeed.on('peer-add', () => console.log('Connected to a peer for remote feed'));
            this.remoteFeed.on('download', (index) => {
                console.log('[remoteFeed] Download detected, starting live read stream');
                this.setupDBStream(this.remoteDB);
                console.log('Downloaded block:', index)
            });
        }
    }

    setupDBStream(dbInstance) {
        this.stream = dbInstance.createReadStream(null, { live: true });
        
        this.stream.on('data', (data) => {
            console.log('[DBStream] New data:', data.key, data.value);
            // listened in swarm-helper.js
            CustomEvent.emit(EventType.STREAM, data);
        });

    }

    async put(key, val) {
        if (!this.ownFeed.writable) {
            throw new Error('This feed is read-only on this node');
        }
        await this.db.put(key, val);
        console.log('Data written to own Hyperbee feed!');
    }
}

module.exports = Storage;
