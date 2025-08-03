const { SIGN_STATUS, DEFAULT_SIGN_SEPARATOR } = require('./constants');
const { CustomEvent } = require('../custom-events/setup');
const { EventType } = require('../custom-events/constants');
const { DATA_TYPE } = require('../p2p/constants');

class SafeSign {
    constructor(opts) {
        this.node_id = opts.pubKey;
        this.owners = [];
        this.signatures = [];
        this.threshold = opts.threshold;
        this.ownersTotal = opts.ownersTotal;
        
        this.db = opts.db;
        this.ipc = opts.ipc;
        this.providerUrl = opts.url;
        
        this.signCountMap = new Map();
        this.signingStatusMap = new Map();
        
        this.txnProposalMap = new Map();
        this.signatureMapLocal = new Map();
        this.signatureMapRemote = new Map();
        this.txnUnderSigningMap = new Map();
        this.thresholdAchievedMap = new Map();
        this.currentlySigningMap = new Map();

        this.listenEvents();
    }

    handleSigned(txnHash) {
        this.incSignCountFor(txnHash);
    }

    async handleProposed(txData) {
        const txnHash = txData.txnHash;
        if(!this.hasAchievedThreshold(txnHash)) {
            this.addProposal(txData, txnHash)
            await this.signTxn(txData);
            this.incSignCountFor(txnHash);
        } else {
            
            // event not handled anywhere
            // let other nodes know about this by storing and replicating
            CustomEvent.emit(EventType.THRESHOLD_ACHIEVED, txnHash);
        }
    }

    hasAchievedThreshold(txnHash) {
        return this.thresholdAchievedMap.get(txnHash);
    }

    hasSignedLocal(txnHash) {
        return this.signatureMapLocal.has(txnHash);
    }

    hasSignatureRemote_searchByNodeId(txnHash, nodeId) {
        const sigList = this.signatureMapRemote.get(txnHash) || [];
        return sigList.some(sig => sig.node_id === nodeId);
    }

    async handleSigningFromRemoteFeeder(txData) {
        // check if we have already signed the txnHash
        if(this.hasSignedLocal(txData.key)) {
            console.log('Already local signed:', txData.key);
            // because the feeder feeds old data as well,
            // we need to check if we have already added
            // the incoming data by checking if signatureMapRemote has it
            const nodeId = txData.value.node_id;
            if(this.hasSignatureRemote_searchByNodeId(txData.key, nodeId)) {
                console.log('Returning!: already remote added:', txData.key);
                return;
            }
            // add the incoming to signatureMapRemote
            this.addSignatureRemote(txData.value, txData.key);
            this.incSignCountFor(txData.key);
        } else {
            console.log('Local signing..: not local signed:', txData.key);
            // if not then lets sign it
            await this.handleProposed({
                txnHash: txData.key,
                data: txData.value.data
            });
        }
    }

    listenEvents() {
        CustomEvent.off(EventType.PROPOSE_TXN, async data => await this.handleProposed(data))
        CustomEvent.on(EventType.PROPOSE_TXN, async data => await this.handleProposed(data))

        CustomEvent.off(EventType.SIGNED, data => this.handleSigned(data))
        CustomEvent.on(EventType.SIGNED, data => this.handleSigned(data))

        CustomEvent.off(EventType.STREAM, async data => await this.handleSigningFromRemoteFeeder(data));
        CustomEvent.on(EventType.STREAM, async data => await this.handleSigningFromRemoteFeeder(data));
    }

    reset() {
        this.thresholdCounter = 0;
        this.thresholdAchieved = false;
    }

    async initSdk() {
        
    }

    // maybe called by the swarm / some event listener
    incSignCountFor(txnHash) {
        if(this.thresholdAchievedMap.get(txnHash))
            return -1;
        let x = this.signCountMap.get(txnHash);
        
        if(!x) x = 0;

        this.signCountMap.set(txnHash, x + 1);
        console.log('X:', x, ' TH:', this.threshold);
        if(x+1 >= this.threshold) {
            this.thresholdAchievedMap.set(txnHash, true);
            this.signingStatusMap.set(txnHash, SIGN_STATUS.COMPLETED);

            // emit an event to notify other parts of the service node
            // event not handled anywhere
            // we can store and replicate to other nodes
            CustomEvent.emit(EventType.THRESHOLD_ACHIEVED, txnHash);
        }

        return 0;
    }

    async signViaEnclave(txnHash) {

        return await this.ipc.enclaveSignData(txnHash)
    }

    // maybe coming from other nodes
    addSignatureLocal(sig, txnHash) {
        if(this.signatureMapLocal.has(txnHash)) return;
        this.signatureMapLocal.set(txnHash, sig);
    }
    addSignatureRemote(sigObj, txnHash) {

        const sigList = this.signatureMapRemote.has(txnHash) ? Array.from(this.signatureMapRemote.get(txnHash)) : [];
        sigList.push({...sigObj});
        this.signatureMapRemote.set(txnHash, [...sigList]);
    }

    async storeInHyperDb(key, value) {
        await this.db.put(key, value);
    }

    isCurrentlySigning(txnHash) {
        return this.currentlySigningMap.has(txnHash);
    }

    setCurrentlySigning(txnHash) {
        this.currentlySigningMap.set(txnHash, true);
    }

    async signTxn(txnData) {
        const txnHash = txnData.txnHash;

        if(this.isCurrentlySigning(txnHash)) return;
        this.setCurrentlySigning(txnHash);
        // to hex
        // const hexData = Buffer.from(txnData.data).toString('hex');
        // add logic to start the signing process
        const signature = await this.signViaEnclave(txnHash);

        
        this.addSignatureLocal(signature, txnHash);
        this.signingStatusMap.set(txnHash, SIGN_STATUS.LOCAL_SIGNED);

        await this.storeInHyperDb(txnHash, {
            signature,
            node_id: this.node_id,
            type: DATA_TYPE.SIGNATURE,
        });
    }

    addProposal(txn, txnHash) {
        this.txnProposalMap.set(txnHash, txn);
        this.signingStatusMap.set(txnHash, SIGN_STATUS.PROPOSED);
    }

    getProposal(txnHash) {
        return this.txnProposalMap.get(txnHash)
    }

    getAchievedSignsTotal(txHash) {
        return this.signCountMap.get(txHash);
    }

    // get the current status of multi signing
    getMultisigStatus(txnHash) {
        if(!this.signingStatusMap.has(txnHash))
            return SIGN_STATUS.NOT_AV;
        return this.signingStatusMap.get(txnHash)
    }

    // will be called eventually by frontend after multisig is completed
    getSignaturesJoined(txnHash, sep=DEFAULT_SIGN_SEPARATOR) {
        if(this.hasAchievedThreshold(txnHash)) {
            const rmtSigList = (this.signatureMapRemote.get(txnHash) || []).map(sigO => sigO.signature);
            const lclSig = this.signatureMapLocal.get(txnHash) || '';
            
            return [...rmtSigList, lclSig].join(sep);
        }
        console.log('no signatures for txnHash:', txnHash);
        return '';
    }
}

module.exports = SafeSign;