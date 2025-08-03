const utils = require('./utils.js');
const Corestore = require('corestore');
const Hyperbee = require('hyperbee');
const { CustomEvent } = require('../custom-events/setup.js');
const { EventType } = require('../custom-events/constants');
const { STORE_EVENT_TYPE } = require('./constants.js');

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
        this.maxSeqNum = 0;
    }

    async setup() {
        this.store = new Corestore(this.coreStorePath);
        await this.store.ready();
        // this.maxSeqNum = utils.getPersistedMaxSeqNum(this.coreStorePath);

        this.store.on(STORE_EVENT_TYPE.FEED, (feed) => {
            console.log('Replicating feed:', feed.key.toString('hex'));
        });
        // Always create/open a writable feed for this node
        this.ownFeed = this.store.get({ name: 'own-feed' });
        await this.ownFeed.ready();
        
        console.log('[ownFeed] discoveryKey:', this.ownFeed.discoveryKey.toString('hex'))
        console.log('Writable feed key (share if others should read it):', this.ownFeed.key.toString('hex'));

        // Local DB for writing
        this.db = new Hyperbee(this.ownFeed, {
            live: true,
            keyEncoding: 'utf-8',
            valueEncoding: 'json'
        });

        // If remote core key is provided, open it in read-only mode
        if (this.remoteCoreFeedPubKey) {
            this.remoteFeed = this.store.get({ key: Buffer.from(this.remoteCoreFeedPubKey, 'hex') });
            await this.remoteFeed.ready();
            this.remoteFeed.download();

            this.remoteDB = new Hyperbee(this.remoteFeed, {
                live: true,
                keyEncoding: 'utf-8',
                valueEncoding: 'json'
            });

            console.log('[remoteFeed] discoveryKey:', this.remoteFeed.discoveryKey.toString('hex'))
            
            this.remoteFeed.on(STORE_EVENT_TYPE.CONNECT, () => console.log('Connected to a peer for remote feed'));
            
            this.remoteFeed.on(STORE_EVENT_TYPE.DOWNLOAD, (index) => {
                // console.log('[remoteFeed] Download detected, starting live read stream');
                this.setupDBStream(this.remoteDB, index);
                // console.log('Downloaded block:', index)
            });
        }
    }

    setupDBStream(dbInstance, index) {
        this.stream = dbInstance.createHistoryStream({ reverse: true, limit: 1 });
        
        this.stream.on(STORE_EVENT_TYPE.DATA, (data) => {
            // console.log('[DBStream] New data');
            // listened in swarm-helper.js

            // handle old
            // ..to be ctd..
            console.log('Handling new data at index:', index, data)
            CustomEvent.emit(EventType.STREAM, data);
            // if(index > this.maxSeqNum) {
            //     this.maxSeqNum = index;
            //     utils.persistMaxSeqNum(this.coreStorePath, index);
            // } else {
            //     console.log('Ignoring old data at index:', index)
            // }

        });

    }

    async put(key, val) {
        if (!this.ownFeed.writable) {
            throw new Error('This feed is read-only on this node');
        }
        await this.db.put(key, val);
        // console.log('[Storage->put] Data written to own Hyperbee feed!', key, val);
    }
}

module.exports = Storage;
