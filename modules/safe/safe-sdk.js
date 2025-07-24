const Safe = require('@safe-global/protocol-kit').default;
const { createWalletClient, http, fallback } = require("viem");
const { hardhat } = require("viem/chains");
const { ADDR, ABI } = require('./constants');
const { Wallet } = require('ethers');

class SafeSDK {
    constructor(opts) {
        this.owners = [];
        this.signatures = [];
        this.threshold = opts.threshold;
        this.ownersTotal = opts.ownersTotal;
        this.thresholdCounter = 0;
        this.thresholdAchieved = false;
        
        this.chain = opts.chain;
        this.providerUrl = opts.url;

    }

    set threshold(th) {
        this.threshold = th;
    }
    
    set ownersTotal(ot) {
        this.ownersTotal = ot;
    }

    reset() {
        this.thresholdCounter = 0;
        this.thresholdAchieved = false;
    }

    addOwner(owner) {
        if(this.thresholdCounter >= this.owners.length) {
            this.thresholdAchieved = true;
        }
        if(this.owners.length == this.ownersTotal) return false;
        this.owners.push(owner)
        ++this.thresholdCounter;
        return true;
    }

    async initSdk(pvtKey) {
        const deployer = new Wallet(pvtKey);
        
        hardhat.id = 1337;
        
        const signerCumProvider = createWalletClient({
            chain: this.chain || hardhat,
            transport: http(this.providerUrl),
            // ensure the address of the one who deployed the safe proxy contract
            account: deployer.address,
        });

        // this is a hack the bypass passkey rawId being undefined
        signerCumProvider.key = 'passkeyWallet';

        const safeSdk = await Safe.init({
            signer: signerCumProvider,
            provider: signerCumProvider,
    
            safeAddress: ADDR.PROXY_SAFE,
        
            contractNetworks: {
                [chainId]: {
                    // addresses
                    multiSendAddress: ADDR.MULTI_SEND,
                    createCallAddress: ADDR.CREATE_CALL,
                    safeSingletonAddress: ADDR.SAFE_SINGLETON,
                    signMessageLibAddress: ADDR.SIGN_MESSAGE_LIB,
                    fallbackHandlerAddress: ADDR.FALLBACK_HANDLER,
                    safeProxyFactoryAddress: ADDR.SAFE_PROXY_FACTORY,
                    multiSendCallOnlyAddress: ADDR.MULTI_SEND_CALL_ONLY,
                    simulateTxAccessorAddress: ADDR.SIMULATE_TX_ACCESSOR,
                    safeWebAuthnSharedSignerAddress: ADDR.SAFE_WEB_AUTHN_SHARED_SIGNER,
                    safeWebAuthnSignerFactoryAddress: ADDR.SAFE_WEB_AUTHN_SIGNER_FACTORY,
                    // Abis
                    multiSendAbi: ABI.MULTI_SEND,
                    createCallAbi: ABI.CREATE_CALL,
                    safeSingletonAbi: ABI.SAFE_SINGLETON,
                    signMessageLibAbi: ABI.SIGN_MESSAGE_LIB,
                    fallbackHandlerAbi: ABI.FALLBACK_HANDLER,
                    safeProxyFactoryAbi: ABI.SAFE_PROXY_FACTORY,
                    multiSendCallOnlyAbi: ABI.MULTI_SEND_CALL_ONLY,
                    simulateTxAccessorAbi: ABI.SIMULATE_TX_ACCESSOR,
                    safeWebAuthnSharedSignerAbi: ABI.SAFE_WEB_AUTHN_SHARED_SIGNER,
                    safeWebAuthnSignerFactoryAbi: ABI.SAFE_WEB_AUTHN_SIGNER_FACTORY,
                }
            }
        });
    }

    executeTxn() {

    }
}

module.exports = SafeSDK;
