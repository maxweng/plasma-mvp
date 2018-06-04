import client from "./client";


const testAddress = "0xfd02EcEE62797e75D86BCff1642EB0844afB28c7";


const logBalance = async (address=testAddress) => {
    console.log("balance", (await client.getBalance("0xfd02EcEE62797e75D86BCff1642EB0844afB28c7")).data.result);
};


const getUTXOs = async (address=testAddress) => {
    return (await client.getUTXO("0xfd02ecee62797e75d86bcff1642eb0844afb28c7")).data.result;
};


const sleep = async (ms) => {
    await new Promise(resolve => setTimeout(resolve, 500));
}


const testTx = async () => {
    console.log("---------- testing transaction ----------");
    try {
        await client.sendDeposit("0x0", 100, 0, "0xfd02EcEE62797e75D86BCff1642EB0844afB28c7");
        let utxos;
        while(1){
            utxos = await getUTXOs();
            if(utxos.length > 0){
                break;
            }
            sleep(500);
        }
        for(let i in utxos){
            let utxo = utxos[i];
            if (utxo[4] >= 0 && utxo[5] == 0){
                console.log(utxo);
//                 await client.sendTransaction(utxo[0], utxo[1], utxo[2], 0, 0, 0, "0xfd02ecee62797e75d86bcff1642eb0844afb28c7", utxo[3], utxo[4] - 1, utxo[5], "0x4b3ec6c9dc67079e82152d6d55d8dd96a8e6aa26", utxo[3], 1, 0, undefined, undefined, undefined, undefined, undefined, "0xfd02ecee62797e75d86bcff1642eb0844afb28c7", "0xfd02ecee62797e75d86bcff1642eb0844afb28c7");
                await client.sendTransaction(utxo[0], utxo[1], utxo[2], 0, 0, 0, "0xfd02ecee62797e75d86bcff1642eb0844afb28c7", utxo[3], utxo[4] - 1, utxo[5], "0x4b3ec6c9dc67079e82152d6d55d8dd96a8e6aa26", utxo[3], 1, 0);
                sleep(500);
                await logBalance();
                break;
            }
        }
    } catch(e) {
        console.log(e);
        process.exit();
    }
};


const testPsTx = async () => {
    console.log("---------- testing partially signed transaction ----------");
    console.log("ps tranctions", (await client.getAllPsTransactions()).data.result);
    let utxos = await getUTXOs();
    for(let i in utxos){
        let utxo = utxos[i];
        if (utxo[4] >= 0 && utxo[5] == 0){
            console.log(utxo);
            await client.sendPsTransaction(utxo[0], utxo[1], utxo[2], "0xfd02ecee62797e75d86bcff1642eb0844afb28c7", utxo[3], utxo[4] - 1, utxo[5], utxo[3], 1, 0);
            sleep(500);

            await logBalance();
            let psTransaction = (await client.getAllPsTransactions()).data.result[0];
            console.log(psTransaction);
            await client.sendPsTransactionFill(psTransaction, 0, 0, 0, "0x4b3ec6c9dc67079e82152d6d55d8dd96a8e6aa26");
            sleep(500);
            console.log("ps tranctions", (await client.getAllPsTransactions()).data.result);
            await logBalance();
            break;
        }
    }
}


const main = async () => {
    await testTx();
    await testPsTx();
    process.exit();
};


main();