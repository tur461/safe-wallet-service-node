const hre = require("hardhat");
const Safe = require('@safe-global/protocol-kit').default;
const { ethers } = hre;
const { createWalletClient, createPublicClient, http, fallback } = require("viem");
const { hardhat } = require("viem/chains");
const fs = require('fs');

async function main() {
  const [deployer, owner2, owner3] = await hre.ethers.getSigners();
  console.log("Deploying Safe{Core} singleton contracts with account:", deployer.address);

  // 1. CompatibilityFallbackHandler
  const CompatibilityFallbackHandler = await hre.ethers.getContractFactory("CompatibilityFallbackHandler");
  const compatibilityFallbackHandler = await CompatibilityFallbackHandler.deploy();
  await compatibilityFallbackHandler.deployed();

  // 2. CreateCall
  const CreateCall = await hre.ethers.getContractFactory("CreateCall");
  const createCall = await CreateCall.deploy();
  await createCall.deployed();

  // 3. GnosisSafe
  const GnosisSafe = await hre.ethers.getContractFactory("Safe");
  const gnosisSafe = await GnosisSafe.deploy();
  await gnosisSafe.deployed();

  // 4. GnosisSafeL2
  const GnosisSafeL2 = await hre.ethers.getContractFactory("SafeL2");
  const gnosisSafeL2 = await GnosisSafeL2.deploy();
  await gnosisSafeL2.deployed();

  // 5. MultiSend
  const MultiSend = await hre.ethers.getContractFactory("MultiSend");
  const multiSend = await MultiSend.deploy();
  await multiSend.deployed();

  // 6. MultiSendCallOnly
  const MultiSendCallOnly = await hre.ethers.getContractFactory("MultiSendCallOnly");
  const multiSendCallOnly = await MultiSendCallOnly.deploy();
  await multiSendCallOnly.deployed();

  // 7. SafeProxyFactory
  const SafeProxyFactory = await hre.ethers.getContractFactory("SafeProxyFactory");
  const proxyFactory = await SafeProxyFactory.deploy();
  await proxyFactory.deployed();

  // 8. SignMessageLib
  const SignMessageLib = await hre.ethers.getContractFactory("SignMessageLib");
  const signMessageLib = await SignMessageLib.deploy();
  await signMessageLib.deployed();

  // 9. SimulateTxAccessor
  const SimulateTxAccessor = await hre.ethers.getContractFactory("SimulateTxAccessor");
  const simulateTxAccessor = await SimulateTxAccessor.deploy();
  await simulateTxAccessor.deployed();
  
  // 9. SafeWebAuthnSignerFactory
  const SafeWebAuthnSignerFactory = await hre.ethers.getContractFactory("SafeWebAuthnSignerFactory");
  const safeWebAuthnSignerFactory = await SafeWebAuthnSignerFactory.deploy();
  await safeWebAuthnSignerFactory.deployed();
  
  // 9. SafeWebAuthnSharedSigner
  const SafeWebAuthnSharedSigner = await hre.ethers.getContractFactory("SafeWebAuthnSharedSigner");
  const safeWebAuthnSharedSigner = await SafeWebAuthnSharedSigner.deploy();
  await safeWebAuthnSharedSigner.deployed();

  console.log(`
compatibility_fallback_handler: \`${compatibilityFallbackHandler.address}\`
create_call: \`${createCall.address}\`
gnosis_safe: \`${gnosisSafe.address}\`
gnosis_safe_l2: \`${gnosisSafeL2.address}\`
multi_send: \`${multiSend.address}\`
multi_send_call_only: \`${multiSendCallOnly.address}\`
proxy_factory: \`${proxyFactory.address}\`
sign_message_lib: \`${signMessageLib.address}\`
simulate_tx_accessor: \`${simulateTxAccessor.address}\`
safe_web_authn_shared_signer: \`${safeWebAuthnSharedSigner.address}\`
safe_web_authn_signer_factory: \`${safeWebAuthnSignerFactory.address}\`
  `);

  // --- Deploy a new Safe (2-of-3) using the freshly deployed contracts ---
  const proxyFactoryInstance = proxyFactory.connect(deployer);

  // Owners: use deployer + 2 dummy accounts (replace with real ones)
  const owners = [
    deployer.address,
    owner2.address,
    owner3.address,
  ];
  const threshold = 2;

  // Encode setup() call using gnosisSafe contract factory
  const gnosisSafeInstance = await hre.ethers.getContractAt("Safe", gnosisSafe.address);
  const initializer = gnosisSafeInstance.interface.encodeFunctionData("setup", [
    owners,
    threshold,
    ethers.constants.AddressZero,
    "0x",
    compatibilityFallbackHandler.address, // fallback handler
    ethers.constants.AddressZero,
    0,
    ethers.constants.AddressZero
  ]);

  console.log("Deploying 2-of-3 Safe wallet...");
  const tx = await proxyFactoryInstance.createProxyWithNonce(
    gnosisSafe.address,
    initializer,
    0 // nonce
  );
  const receipt = await tx.wait();

  const proxyCreationEvent = receipt.events.find((e) => e.event === "ProxyCreation");
  const proxyAddress = proxyCreationEvent ? proxyCreationEvent.args.proxy : receipt.logs[0].address;

  console.log("2-of-3 Safe deployed at (i.e. safeAddress):", proxyAddress);
  // const provider = new hre.ethers.providers.JsonRpcProvider('http://localhost:8545');
  // const { chainId } = await provider.getNetwork();
  hardhat.id = 1337; // Set Hardhat chain ID for viem compatibility
  const provider = createWalletClient({
    chain: hardhat,
    transport: http('http://localhost:8545'),
    account: deployer.address,
  });
  const walletClient = createWalletClient({
      chain: hardhat,
      transport: http('http://localhost:8545'),
      account: deployer.account,  // ensure deployer.account, not deployer.address
  });

  // console.log("Provider:", provider);

  const chainId = await provider.getChainId()
  console.log("Chain ID:", chainId);
  console.log("Factory Address:", safeWebAuthnSignerFactory.address);
  console.log("Shared Signer Address:", safeWebAuthnSharedSigner.address);
  console.log("Proxy Address:", proxyAddress)


  // walletClient.key = 'passkeyWallet'
  const safeSdk = await Safe.init({
    signer: walletClient, // use deployer as signer
    provider: provider,
    safeAddress: proxyAddress,
  
    // isL1SafeSingleton: true, // use L1 gnosis safe
    contractNetworks: {
    [chainId]: {
      safeSingletonAddress: gnosisSafe.address,
      safeSingletonAbi: await getArt("Safe").abi,
      safeProxyFactoryAddress: proxyFactory.address,
      safeProxyFactoryAbi: await getArt("SafeProxyFactory").abi,
      multiSendAddress: multiSend.address,
      multiSendAbi: await getArt("MultiSend").abi,
      multiSendCallOnlyAddress: multiSendCallOnly.address,
      multiSendCallOnlyAbi: await getArt("MultiSendCallOnly").abi,
      fallbackHandlerAddress: compatibilityFallbackHandler.address,
      fallbackHandlerAbi: await getArt("CompatibilityFallbackHandler").abi,
      signMessageLibAddress: signMessageLib.address,
      signMessageLibAbi: await getArt("SignMessageLib").abi,
      createCallAddress: createCall.address,
      createCallAbi: await getArt("CreateCall").abi,
      simulateTxAccessorAddress: simulateTxAccessor.address,
      simulateTxAccessorAbi: await getArt("SimulateTxAccessor").abi,
      safeWebAuthnSignerFactoryAddress: safeWebAuthnSignerFactory.address,
      safeWebAuthnSignerFactoryAbi: await getArt("SafeWebAuthnSignerFactory").abi,
      safeWebAuthnSharedSignerAddress: safeWebAuthnSharedSigner.address,
      safeWebAuthnSharedSignerAbi: await getArt("SafeWebAuthnSharedSigner").abi,
      // you can also add the other addresses of Safe contracts you deployed
    }
  }
    
  });
  console.log("Safe:", safeSdk);
}

async function getArt(w) {
  const art = await hre.artifacts.readArtifact(w);
  fs.writeFileSync('./abi/'+w+'.json', JSON.stringify(art.abi, null, 2));
  return art;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
