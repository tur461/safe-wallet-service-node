const { ADDR } = require("./constants");

async function getKits(n, signerKeys) {
  const kits = [];

  for(let i=0; i<n; ++i) {
    const kit = await Safe.init({
      signer: signerKeys[i],
      provider: RPC_URL,
      safeAddress: opts.proxyAddress,
    
      // isL1SafeSingleton: true, // use L1 gnosis safe
      contractNetworks: {
        [opts.chainId]: {
            multiSendAddress: ADDR.MULTI_SEND,
            createCallAddress: ADDR.CREATE_CALL,
            safeSingletonAddress: ADDR.SAFE_SINGLETON,
          safeProxyFactoryAddress: ADDR.SAFE_PROXY_FACTORY,
          signMessageLibAddress: ADDR.SIGN_MESSAGE_LIB,
          multiSendCallOnlyAddress: ADDR.MULTI_SEND_CALL_ONLY,
          simulateTxAccessorAddress: ADDR.SIMULATE_TX_ACCESSOR,
          fallbackHandlerAddress: ADDR.FALLBACK_HANDLER,
          safeWebAuthnSharedSignerAddress: ADDR.SAFE_WEB_AUTHN_SHARED_SIGNER,
          safeWebAuthnSignerFactoryAddress: ADDR.SAFE_WEB_AUTHN_SIGNER_FACTORY,
          safeSingletonAbi: require("../abis/Safe.json"),
          multiSendAbi: require("../abis/MultiSend.json"),
          createCallAbi: require("../abis/CreateCall.json"),
          signMessageLibAbi: require("../abis/SignMessageLib.json"),
          safeProxyFactoryAbi: require("../abis/SafeProxyFactory.json"),
          multiSendCallOnlyAbi: require("../abis/MultiSendCallOnly.json"),
          simulateTxAccessorAbi: require("../abis/SimulateTxAccessor.json"),
          fallbackHandlerAbi: require("../abis/CompatibilityFallbackHandler.json"),
          safeWebAuthnSharedSignerAbi: require("../abis/SafeWebAuthnSharedSigner.json"),
          safeWebAuthnSignerFactoryAbi: require("../abis/SafeWebAuthnSignerFactory.json"),
          // you can also add the other addresses of Safe contracts you deployed
        }
      }
    });
    kits.push(kit);
  }
  return [...kits];
}

module.exports = {
    getKits,
}

