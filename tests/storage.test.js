/* eslint-disable no-undef */
// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");
const secret = 'hello'
const secretBytes = ethers.utils.formatBytes32String(secret)
const secretHash = ethers.utils.keccak256(secretBytes)
const funcds = 10000000

before(async function( ){
  accounts = await ethers.getSigners()
  owner = accoutns[0]
  player1 = accounts[1]
  player2 = accounts[2]
  guessingGame = await ethers.getContractFactory("GuessingGame")
  contract = await guessingGame.deploy()
  await contract.deployed()
})

describe("Storage", function () {

it("test init game", async function(){
  const oldBalance = await ethers.provider.
})
  it("test initial value", async function () {
    const Storage = await ethers.getContractFactory("Storage");
    const storage = await Storage.deploy();
    await storage.deployed();
    console.log("storage deployed at:" + storage.address);
    expect((await storage.retrieve()).t
    
    
    
    Number()).to.equal(0);
  });
  it("test updating and retrieving updated value", async function () {
    const Storage = await ethers.getContractFactory("Storage");
    const storage = await Storage.deploy();
    await storage.deployed();
    const storage2 = await ethers.getContractAt("Storage", storage.address);
    const setValue = await storage2.store(56);
    await setValue.wait();
    expect((await storage2.retrieve()).toNumber()).to.equal(56);
  });

});



