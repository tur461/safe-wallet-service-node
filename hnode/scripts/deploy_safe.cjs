// https://docs.safe.global/reference-sdk-protocol-kit/transactions/createtransaction

const hre = require("hardhat");
const { Wallet, utils } = require('ethers');
const Safe = require('@safe-global/protocol-kit').default;
const { ethers } = hre;
const { createWalletClient, createPublicClient, http, fallback } = require("viem");
const { hardhat } = require("viem/chains");
const fs = require('fs');
const OperationType = require('@safe-global/types-kit').OperationType;
// const SafeApiKit = require('@safe-global/api-kit').default;
// const privateKeyToAccount = require('viem/accounts').privateKeyToAccount;

const RPC_URL = 'http://localhost:8545';

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
  console.log('owners', owners);
  const threshold = 2;

  // Encode setup() call using gnosisSafe (L2 here) contract factory
  const gnosisSafeInstance = await hre.ethers.getContractAt("SafeL2", gnosisSafeL2.address);
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
    gnosisSafeL2.address,
    initializer,
    0 // nonce
  );
  const receipt = await tx.wait();

  const proxyCreationEvent = receipt.events.find((e) => e.event === "ProxyCreation");
  const proxyAddress = proxyCreationEvent ? proxyCreationEvent.args.proxy : receipt.logs[0].address;

  console.log("2-of-3 Safe deployed at (i.e. safeAddress):", proxyAddress);
  
  // verify
  const safeImpl = await hre.ethers.provider.getStorageAt(proxyAddress, "0x0");
  console.log("Proxy implementation slot:", safeImpl);
  console.log("gnosisSafeL2:", gnosisSafeL2.address);

  const provider = new hre.ethers.providers.JsonRpcProvider(RPC_URL);
  const { chainId } = await provider.getNetwork();
  
  const signerKeys = ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  ]

  const kits = await getKits({
    compatibilityFallbackHandler,
    createCall,
    gnosisSafe,
    gnosisSafeL2,
    multiSend,
    multiSendCallOnly,
    proxyFactory,
    signMessageLib,
    simulateTxAccessor,
    safeWebAuthnSignerFactory,
    safeWebAuthnSharedSigner,
    proxyAddress,
    chainId,

  }, threshold, signerKeys);

  const safeTransactionData = {
    to: owner3.address,
    value: hre.ethers.utils.parseEther("0.000000000000000001").toString(), // 1 wei
    data: '0x',
    operation: OperationType.Call
  }

  const safeTransaction = await kits[0].createTransaction({
    transactions: [safeTransactionData]
  })
  // const apiKit = new SafeApiKit({
    //   chainId: chainId,
    //   txServiceUrl: '',
    // })
  // const safeTxGas = await kits[0].estimateSafeTxGas(safeTransaction)
  // console.log('safeTxn gas:', safeTxGas);

  // safeTransaction.data.safeTxGas = safeTxGas.toString()
  
  
  // const senderSignature = await kits[0].signHash(safeTxHash)
  // console.log('senderSignature:', senderSignature);

  const safeTxHash = await kits[0].getTransactionHash(safeTransaction)
  console.log("SafeTxHash:", safeTxHash)
  
  // const signedTx1 = await kits[0].signTransaction(safeTransaction)
  // console.log('signedTx1 done');
  // const signedTx2 = await kits[1].signTransaction(signedTx1)
  // console.log('signedTx2 done');
  
  const sig1 = await signWithEnclave(safeTxHash, signerKeys[0])
  const sig2 = await signWithEnclave(safeTxHash, signerKeys[1])
  console.log('sig length', sig1.length / 2 - 1)

  safeTransaction.addSignature({
    signer: deployer.address,
    data: sig1,
    staticPart: sig1,
    dynamicPart: "0x"
  })

  safeTransaction.addSignature({
    signer: owner2.address,
    data: sig2,
    staticPart: sig2,
    dynamicPart: "0x"
  })

  // propose (send transaction details to wallet service)
  // await protocolKitOwner1.proposeTransaction({
  //   proxyAddress, // safeAddress
  //   safeTransactionData: safeTransaction.data,
  //   safeTxHash,
  //   senderAddress: deployer.address,
  //   senderSignature: senderSignature.data
  // })

  // retrieve pending txns
  
  // const pendingTransactions = (await apiKit.getPendingTransactions(safeAddress)).results
  
  // confirm the txn
  
  // const protocolKitOwner2 = await Safe.init({
  //   provider: RPC_URL,
  //   signer: OWNER_2_PRIVATE_KEY,
  //   safeAddress: SAFE_ADDRESS
  // })

  // const safeTxHash = transaction.transactionHash
  // const signature = await protocolKitOwner2.signHash(safeTxHash)

  // // Confirm the Safe transaction
  // const signatureResponse = await apiKit.confirmTransaction(
  //   safeTxHash,
  //   signature.data
  // )

  // retrieve the fully signed txn from service
  
  // const safeTransaction = await apiKit.getTransaction(safeTxHash)
  
  // and execute onchain
  
  // const executeTxResponse = await protocolKitOwner1.executeTransaction(safeTransaction)



  await deployer.sendTransaction({
    to: proxyAddress,
    value: hre.ethers.utils.parseEther("1.0") // 1 ETH for example
  })

  const balance = await hre.ethers.provider.getBalance(proxyAddress)
  console.log("Safe balance:", hre.ethers.utils.formatEther(balance))

  
  // const txResponse = await kits[0].executeTransaction(signedTx2)
  const txResponse = await kits[0].executeTransaction(safeTransaction)
  await txResponse.transactionResponse.wait()
  console.log("Transaction executed:", txResponse)
  console.log('completed')

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

async function getKits(opts, n, signerKeys) {
  const kits = [];

  for(let i=0; i<n; ++i) {
    const kit = await Safe.init({
      signer: signerKeys[i],
      provider: RPC_URL,
      safeAddress: opts.proxyAddress,
    
      // isL1SafeSingleton: true, // use L1 gnosis safe
      contractNetworks: {
        [opts.chainId]: {
          safeSingletonAddress: opts.gnosisSafeL2.address,
          safeSingletonAbi: await getArt("Safe").abi,
          safeProxyFactoryAddress: opts.proxyFactory.address,
          safeProxyFactoryAbi: await getArt("SafeProxyFactory").abi,
          multiSendAddress: opts.multiSend.address,
          multiSendAbi: await getArt("MultiSend").abi,
          multiSendCallOnlyAddress: opts.multiSendCallOnly.address,
          multiSendCallOnlyAbi: await getArt("MultiSendCallOnly").abi,
          fallbackHandlerAddress: opts.compatibilityFallbackHandler.address,
          fallbackHandlerAbi: await getArt("CompatibilityFallbackHandler").abi,
          signMessageLibAddress: opts.signMessageLib.address,
          signMessageLibAbi: await getArt("SignMessageLib").abi,
          createCallAddress: opts.createCall.address,
          createCallAbi: await getArt("CreateCall").abi,
          simulateTxAccessorAddress: opts.simulateTxAccessor.address,
          simulateTxAccessorAbi: await getArt("SimulateTxAccessor").abi,
          safeWebAuthnSignerFactoryAddress: opts.safeWebAuthnSignerFactory.address,
          safeWebAuthnSignerFactoryAbi: await getArt("SafeWebAuthnSignerFactory").abi,
          safeWebAuthnSharedSignerAddress: opts.safeWebAuthnSharedSigner.address,
          safeWebAuthnSharedSignerAbi: await getArt("SafeWebAuthnSharedSigner").abi,
          // you can also add the other addresses of Safe contracts you deployed
        }
      }
    });
    kits.push(kit);
  }
  return [...kits];
}

async function signWithEnclave(safeTxHash, privateKey) {
  const msgBytes = utils.arrayify(safeTxHash);

  const wallet = new Wallet(privateKey);

  // Sign the digest directly, skipping the EIP-191 prefix
  const flatSig = wallet._signingKey().signDigest(msgBytes);

  // Normalize v to 27/28
  const v = flatSig.v >= 27 ? flatSig.v : flatSig.v + 27;

  // Combine r, s, v
  const r = utils.arrayify(flatSig.r);
  const s = utils.arrayify(flatSig.s);
  const fullSignature = new Uint8Array([...r, ...s, v]);

  return "0x" + Buffer.from(fullSignature).toString("hex");
}
