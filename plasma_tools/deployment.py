#!/usr/bin/env python
# encoding: utf-8

import os
import sys
import shutil
sys.path.append( os.path.join(os.path.dirname(__file__), '..') )

import json
from solc import compile_standard
from web3.contract import ConciseContract, Contract
from web3 import Web3, HTTPProvider
from plasma.config import plasma_config
from plasma.root_chain.deployer import Deployer
from plasma.child_chain.child_chain import PICKLE_DIR


OWN_DIR = os.path.dirname(os.path.realpath(__file__))
CONTRACTS_DIR = OWN_DIR + '/contracts'
OUTPUT_DIR = OWN_DIR + '/contract_data'


def deploy():
    print("deleting child chain pickle")
    shutil.rmtree(PICKLE_DIR, ignore_errors=True)
    
    deployer = Deployer()
    deployer.compile_all()
    deployer.deploy_contract("RootChain")
    
    deployer = Deployer(CONTRACTS_DIR=CONTRACTS_DIR, OUTPUT_DIR=OUTPUT_DIR)
    deployer.compile_all()
    erc721_contract = deployer.deploy_contract("ERC721Token", args=("My ERC721 Token", "MET721"))
    erc20_contract = deployer.deploy_contract("EIP20", args=(100000000 * (10 ** 18), "GOLD", 18, "GOLD"))
    print("minting erc721 ...")
    erc721_contract.mint(plasma_config["COINBASE"], 1, transact={'from': plasma_config["COINBASE"]})
    erc721_contract.mint(plasma_config["COINBASE"], 888, transact={'from': plasma_config["COINBASE"]})
    print("erc721 initialized")


if __name__ == '__main__':
    deploy()