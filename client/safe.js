const { Wallet, utils } = require("ethers");
const { getKits } = require("./utils");

class Safe {
    constructor(opts) {
        this.kits = [];
        this.rpc = opts.rpc;
        this.keys = opts.keys;
        this.deployer = null;
        this.deployerSafe = null;
        this.threshold = opts.threshold;

        this.init().then();
    }

    async init() {
        this.deployer = new Wallet(this.keys[0]);
        const kits = await getKits(this.threshold, this.keys);
        this.deployerSafe = kits[0];
    }

    async propose() {
        console.log("Proposing transaction...")

        const safeTransactionData = {
            to: owner3.address,
            value: utils.parseEther("0.000000000000000001").toString(), // 1 wei
            data: '0x',
            operation: OperationType.Call
        }

        const safeTransaction = await this.deployerSafe.createTransaction({
            transactions: [safeTransactionData]
        });

        const safeTxHash = await this.deployerSafe.getTransactionHash(safeTransaction)
        const dataStr = JSON.stringify({
            txnHash: safeTxHash,
            data: safeTransactionData,
        })

        const signature = await this.rpc.propose(dataStr)
        console.log("Signature:", signature)
    }

    // async execute() {
    //     const sig1 = await signWithEnclave(safeTxHash, signerKeys[0])
    //     const sig2 = await signWithEnclave(safeTxHash, signerKeys[1])
    //     safeTransaction.addSignature({
    //         signer: deployer.address,
    //         data: sig1,
    //         staticPart: sig1,
    //         dynamicPart: "0x"
    //     })

    //     safeTransaction.addSignature({
    //         signer: owner2.address,
    //         data: sig2,
    //         staticPart: sig2,
    //         dynamicPart: "0x"
    //     })

    //     await deployer.sendTransaction({
    //         to: proxyAddress,
    //         value: hre.ethers.utils.parseEther("1.0") // 1 ETH for example
    //     })

    //     const balance = await hre.ethers.provider.getBalance(proxyAddress)
    //     console.log("Safe balance:", hre.ethers.utils.formatEther(balance))


    //     const txResponse = await this.deployerSafe.executeTransaction(safeTransaction)
    //     await txResponse.transactionResponse.wait()
    //     console.log("Transaction executed:", txResponse)
    //     console.log('completed')
    // }
}

module.exports = Safe;