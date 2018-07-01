import fastx, {ownerAddress} from "./config";
import {getUTXOs, logBalance, sleep} from "./utils";


const wei2eth = (wei) => {
    return fastx.web3.utils.fromWei(""+wei, 'ether')
}


const testDepositExit = async (depositContractAddress, depositAmount, depositTokenId) => {
    console.log("testStartDepositExit");
    const firstEthBalance = await fastx.web3.eth.getBalance(ownerAddress);
    console.log("firstEthBalance", wei2eth(firstEthBalance));
    await fastx.deposit(depositContractAddress, depositAmount, depositTokenId);
    await sleep(1000);
    const depositedEthBalance = await fastx.web3.eth.getBalance(ownerAddress);
    console.log("depositedEthBalance", wei2eth(depositedEthBalance), wei2eth(depositedEthBalance - firstEthBalance));
    console.log("root chain info: ", await fastx.rootChainInfo.getInfo());
    const utxos = await getUTXOs();
    for(const utxo of utxos){
        const [blknum, txindex, oindex, contractAddress, amount, tokenid] = utxo;
        if (blknum % 1000 != 0) {
            console.log("UTXO", utxo);
            const depositPos = blknum * 1000000000 + txindex * 10000 + oindex;
            console.log(depositPos, contractAddress, amount, tokenid)
            await fastx.startExit(blknum, txindex, oindex, contractAddress, amount, tokenid);
            console.log("startExit sent");
            console.log("root chain info: ", await fastx.rootChainInfo.getInfo());
            await sleep(1000);
            await logBalance(ownerAddress);
            await sleep(3000);
            const finalEthBalance = await fastx.web3.eth.getBalance(ownerAddress);
            console.log("finalEthBalance", wei2eth(finalEthBalance), wei2eth(finalEthBalance - firstEthBalance));
            break;
        }
    }
};


const testNormalExit = async () => {
    console.log("testStartDepositExit");
    const firstEthBalance = await fastx.web3.eth.getBalance(ownerAddress);
    console.log("firstEthBalance", wei2eth(firstEthBalance));
    await fastx.deposit("0x0", 1000000000000000000, 0);
    await sleep(1000);
    await fastx.sendEth(ownerAddress, 1000000000000000000 * 0.7, {from:ownerAddress});
    await sleep(500);
    const utxos = await getUTXOs();
    for(const utxo of utxos){
        const [blknum, txindex, oindex, contractAddress, amount, tokenid] = utxo;
        if (blknum % 1000 == 0) {
            console.log("UTXO", utxo);
            const depositPos = blknum * 1000000000 + txindex * 10000 + oindex;
            console.log(depositPos, contractAddress, amount, tokenid);
            while(1){
                const currentChildBlock = await fastx.rootChainInfo.getCurrentChildBlock();
                if (blknum < currentChildBlock) {
                     break;
                }
                console.log("wait for block submit");
                await sleep(1000);
            }
            await fastx.startExit(blknum, txindex, oindex, contractAddress, amount, tokenid);
            console.log("startExit sent");
            console.log("root chain info: ", await fastx.rootChainInfo.getInfo());
            await sleep(1000);
            await logBalance(ownerAddress);
            await sleep(3000);
            const finalEthBalance = await fastx.web3.eth.getBalance(ownerAddress);
            console.log("finalEthBalance", wei2eth(finalEthBalance), wei2eth(finalEthBalance - firstEthBalance));
            break;
        }
    }
};


const testExit = async () => {
//     await testDepositExit("0x0", 1000000000000000000, 0);
    await testNormalExit();
};


export default testExit;


if (typeof require != 'undefined' && require.main == module) {
    testExit();
}