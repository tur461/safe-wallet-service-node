const Safe = require('@safe-global/protocol-kit').default;
const { createWalletClient, http, fallback } = require("viem");
const { hardhat } = require("viem/chains");
const { ADDR, ABI, SIGN_STATUS } = require('./constants');
const { Wallet } = require('ethers');
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

        this.listenEvents();
    }

    handleSigned(txnHash) {
        this.incSignCountFor(txnHash);
    }

    handleProposed(txData) {
        if(!this.hasAchievedThreshold(txData.txnHash)) {
            this.addProposal(txData, txData.txnHash)
            this.signTxn(txData);
            this.incSignCountFor(txData.txnHash);
        } else {
            console.log('threshold already achieved for txnHash:', txData.txnHash);
            
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

    handleSigningFromRemoteFeeder(txData) {
        console.log('[handleSigningFromRemoteFeeder] data:', txData);
        // check if we have already signed the txnHash
        if(this.hasSignedLocal(txData.key)) {
            console.log('this node has already signed the txn:', txData.key);
            // add the incoming to signatureMapRemote
            this.addSignatureRemote(txData.value.signature, txData.key);
            this.incSignCountFor(txData.key);
        } else {
            // if not then lets sign it
            this.handleProposed({
                txnHash: txData.key,
                data: txData.value.data
            });
        }
    }

    listenEvents() {
        CustomEvent.on(EventType.PROPOSE_TXN, this.handleProposed)

        CustomEvent.on(EventType.SIGNED, this.handleSigned)

        CustomEvent.on(EventType.STREAM, this.handleSigningFromRemoteFeeder);
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
        const x = this.signCountMap.get(txnHash);
        this.signCountMap.set(txnHash, parseInt(x) + 1);

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
        console.log('[signViaEnclave]');

        return await this.ipc.enclaveSignData(txnHash)
    }

    // maybe coming from other nodes
    addSignatureLocal(sig, txnHash) {
        console.log('[addSignatureLocal]');
        if(this.signatureMapLocal.has(txnHash)) return;
        this.signatureMapLocal.set(txnHash, sig);
    }
    addSignatureRemote(sig, txnHash) {
        console.log('[addSignatureRemote]');

        const sigList = this.signatureMapRemote.has(txnHash) ? Array.from(this.signatureMapRemote.get(txnHash)) : [];
        sigList.push(sig);
        this.signatureMapRemote.set(txnHash, [...sigList]);
    }

    storeInHyperDb(key, value) {
        this.db.put(key, value);
    }

    async signTxn(txnData) {
        const txnHash = txnData.txnHash;
        // to hex
        const hexData = Buffer.from(txnData.data).toString('hex');
        // add logic to start the signing process
        const signature = await this.signViaEnclave(hexData)

        this.storeInHyperDb(txnHash, {
            signature,
            node_id: this.node_id,
            type: DATA_TYPE.SIGNATURE,
        });

        this.addSignatureLocal(signature, txnHash);
        this.signingStatusMap.set(txnHash, SIGN_STATUS.SIGNED);
        
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
    getSignaturesJoined(txnHash, sep='__') {
        if(this.hasAchievedThreshold(txnHash)) {
            const rmtSigList = this.signatureMapRemote.get(txnHash);
            const lclSig = this.signatureMapLocal.get(txnHash);
            
            return [...rmtSigList, lclSig].join(sep);
        }
        console.log('no signatures for txnHash:', txnHash);
        return '';
    }

    // this will be removed here and will happen on frontend
    executeTxn() {

    }
}

module.exports = SafeSign;


// this will be initialized at frontend
// const safeSdk = await Safe.init({
//             signer: signerCumProvider,
//             provider: this.providerUrl,
    
//             safeAddress: ADDR.PROXY_SAFE,
        
//             contractNetworks: {
//                 [chainId]: {
//                     // addresses
//                     multiSendAddress: ADDR.MULTI_SEND,
//                     createCallAddress: ADDR.CREATE_CALL,
//                     safeSingletonAddress: ADDR.SAFE_SINGLETON,
//                     signMessageLibAddress: ADDR.SIGN_MESSAGE_LIB,
//                     fallbackHandlerAddress: ADDR.FALLBACK_HANDLER,
//                     safeProxyFactoryAddress: ADDR.SAFE_PROXY_FACTORY,
//                     multiSendCallOnlyAddress: ADDR.MULTI_SEND_CALL_ONLY,
//                     simulateTxAccessorAddress: ADDR.SIMULATE_TX_ACCESSOR,
//                     safeWebAuthnSharedSignerAddress: ADDR.SAFE_WEB_AUTHN_SHARED_SIGNER,
//                     safeWebAuthnSignerFactoryAddress: ADDR.SAFE_WEB_AUTHN_SIGNER_FACTORY,
//                     // Abis
//                     multiSendAbi: ABI.MULTI_SEND,
//                     createCallAbi: ABI.CREATE_CALL,
//                     safeSingletonAbi: ABI.SAFE_SINGLETON,
//                     signMessageLibAbi: ABI.SIGN_MESSAGE_LIB,
//                     fallbackHandlerAbi: ABI.FALLBACK_HANDLER,
//                     safeProxyFactoryAbi: ABI.SAFE_PROXY_FACTORY,
//                     multiSendCallOnlyAbi: ABI.MULTI_SEND_CALL_ONLY,
//                     simulateTxAccessorAbi: ABI.SIMULATE_TX_ACCESSOR,
//                     safeWebAuthnSharedSignerAbi: ABI.SAFE_WEB_AUTHN_SHARED_SIGNER,
//                     safeWebAuthnSignerFactoryAbi: ABI.SAFE_WEB_AUTHN_SIGNER_FACTORY,
//                 }
//             }
//         });
