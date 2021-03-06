from functools import wraps

from werkzeug.wrappers import Request, Response
from werkzeug.serving import run_simple
from jsonrpc import JSONRPCResponseManager, dispatcher
from plasma.child_chain.child_chain import ChildChain
from plasma.child_chain.partially_signed_transaction_pool import PartiallySignedTransactionPool
from plasma.child_chain.block_auto_submitter import BlockAutoSubmitter
from plasma.child_chain.finalize_exits_auto_submitter import FinalizeExitsAutoSubmitter
# from plasma.child_chain.liquidity_provider import LiquidilyProvider
from plasma.config import plasma_config
from plasma.root_chain.deployer import Deployer

deployer = Deployer()
root_chain = deployer.get_contract_at_address("RootChain", plasma_config['ROOT_CHAIN_CONTRACT_ADDRESS'], concise=False)
partially_signed_transaction_pool = PartiallySignedTransactionPool()
child_chain = ChildChain(plasma_config['AUTHORITY'], root_chain, partially_signed_transaction_pool=partially_signed_transaction_pool)
BlockAutoSubmitter(child_chain, plasma_config['BLOCK_AUTO_SUMBITTER_INTERVAL']).start()
FinalizeExitsAutoSubmitter(plasma_config['AUTHORITY'], root_chain, plasma_config['FINALIZE_EXITS_AUTO_SUBMITTER_INTERVAL']).start()
# liquidity_provider = LiquidilyProvider(child_chain)


def printKey(key):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            print("Dispatcher: " + key)
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Dispatcher is dictionary {<method_name>: callable}
dispatcher["submit_block"] = lambda block: child_chain.submit_block(block)
dispatcher["apply_transaction"] = lambda transaction: child_chain.apply_transaction(transaction)
dispatcher["get_transaction"] = lambda blknum, txindex: child_chain.get_transaction(blknum, txindex)
dispatcher["get_current_block"] = lambda: child_chain.get_current_block()
dispatcher["get_current_block_num"] = lambda: child_chain.get_current_block_num()
dispatcher["get_block"] = lambda blknum: child_chain.get_block(blknum)
dispatcher["get_balance"] = lambda address, block: child_chain.get_balance(address, block)
dispatcher["get_utxo"] = lambda address, block: child_chain.get_utxo(address, block)
dispatcher["get_all_transactions"] = lambda: child_chain.get_all_transactions()
dispatcher["get_transactions_after"] = lambda block_number, tx_index: child_chain.get_transactions_after(block_number, tx_index)
dispatcher["apply_ps_transaction"] = lambda ps_transaction: partially_signed_transaction_pool.apply_ps_transaction(ps_transaction)
dispatcher["get_all_ps_transactions"] = lambda: partially_signed_transaction_pool.get_all_ps_transactions()
# MetaMask interface
dispatcher["eth_getBalance"] = lambda address, block: child_chain.get_balance(address, block)
dispatcher["eth_getBlockByNumber"] = lambda block, deep: child_chain.get_block_by_num(block, deep)
dispatcher["net_version"] = lambda: child_chain.get_version()
dispatcher["eth_sendRawTransaction"] = lambda raw_tx: child_chain.eth_raw_transaction(raw_tx)
# Liquidity provider (test only)
# dispatcher["get_exchange_rate"] = lambda from_contractaddress, to_contractaddress, amount: liquidity_provider.get_exchange_rate(from_contractaddress, to_contractaddress, amount)
# dispatcher["create_partially_signed_transaction"] = lambda from_contractaddress, to_contractaddress, amount: liquidity_provider.create_partially_signed_transaction(from_contractaddress, to_contractaddress, amount)

for key in dispatcher.keys():
    dispatcher[key] = printKey(key)(dispatcher[key])


@Request.application
def application(request):
    response = JSONRPCResponseManager.handle(
        request.data, dispatcher)
    resp = Response(response.json, mimetype="application/json")
    resp.headers["Access-Control-Allow-Origin"] = '*'
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Content-Length, Authorization, Accept,X-Requested-With"
    resp.headers["Access-Control-Allow-Methods"] = "PUT,POST,GET,DELETE,OPTIONS"
    return resp


if __name__ == '__main__':
    print("COINBASE: " + plasma_config["COINBASE"])
    ssl_context = None
    if plasma_config["CHILD_CHAIN_SSL_CRT_PATH"] and plasma_config["CHILD_CHAIN_SSL_KEY_PATH"]:
        ssl_context = (plasma_config["CHILD_CHAIN_SSL_CRT_PATH"], plasma_config["CHILD_CHAIN_SSL_KEY_PATH"])
    run_simple(plasma_config["CHILD_CHAIN_HOST"], int(plasma_config["CHILD_CHAIN_PORT"]), application, ssl_context=ssl_context)
