const ADDR = {
    PROXY_SAFE: '', // the wallet itself (safeAddress)
    SAFE_SINGLETON: '',
    SAFE_PROXY_FACTORY: '',
    MULTI_SEND: '',
    MULTI_SEND_CALL_ONLY: '',
    FALLBACK_HANDLER: '',
    SIGN_MESSAGE_LIB: '',
    CREATE_CALL: '',
    SIMULATE_TX_ACCESSOR: '',
    SAFE_WEB_AUTHN_SIGNER_FACTORY: '',
    SAFE_WEB_AUTHN_SHARED_SIGNER: '',
}

const ABI = {
    SAFE_SINGLETON: require('./abis/Safe.json'),
    SAFE_PROXY_FACTORY: require('./abis/SafeProxyFactory.json'),
    MULTI_SEND: require('./abis/MultiSend.json'),
    MULTI_SEND_CALL_ONLY: require('./abis/MultiSendCallOnly.json'),
    FALLBACK_HANDLER: require('./abis/CompatibilityFallbackHandler.json'),
    SIGN_MESSAGE_LIB: require('./abis/SignMessageLib.json'),
    CREATE_CALL: require('./abis/CreateCall.json'),
    SIMULATE_TX_ACCESSOR: require('./abis/SimulateTxAccessor.json'),
    SAFE_WEB_AUTHN_SIGNER_FACTORY: require('./abis/SafeWebAuthnSignerFactory.json'),
    SAFE_WEB_AUTHN_SHARED_SIGNER: require('./abis/SafeWebAuthnSharedSigner.json'),
}



module.exports = {
    ABI,
    ADDR,
}