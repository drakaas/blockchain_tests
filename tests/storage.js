/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const secret     = "hello";
const secretHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));

const newSecret     = "world";
const newSecretHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(newSecret));

const funds = ethers.utils.parseEther("1.0");

let accounts, owner, player1, player2, guessingGame, contract;

before(async function () {
  accounts     = await ethers.getSigners();
  owner        = accounts[0];
  player1      = accounts[1];
  player2      = accounts[2];
  guessingGame = await ethers.getContractFactory("GuessingGame");
  contract     = await guessingGame.deploy();
  await contract.deployed();
});

/*
 * 
before init:
  should not init again if initialized
  should not allow to guess
  should not init with 0
  should not init with empty secret
  

 */

describe("GuessingGame", function () {

  it("should init the game with correct secret hash and funds", async function () {
    const oldBalance = await ethers.provider.getBalance(contract.address);
    await contract.connect(owner).init(secretHash, { value: funds });
    const newBalance = await ethers.provider.getBalance(contract.address);
    expect(await contract.initialized()).to.equal(true);
    expect(await contract.secretHash()).to.equal(secretHash);
    expect(newBalance).to.equal(oldBalance.add(funds));
  });

  it("should revert if init is called twice", async function () {
    await expect(
      contract.connect(owner).init(secretHash, { value: funds })
    ).to.be.revertedWith("ALREADY_INITIALIZED");
  });

  it("should revert if init is called by non-owner", async function () {
    const fresh = await (await ethers.getContractFactory("GuessingGame")).deploy();
    await fresh.deployed();
    await expect(
      fresh.connect(player1).init(secretHash, { value: funds })
    ).to.be.revertedWith("ONLY_OWNER");
  });

  it("should set token holder to player1", async function () {
    await contract.connect(owner).setTokenHolder(player1.address);
    expect(await contract.tokenHolder()).to.equal(player1.address);
  });

  it("should revert if setTokenHolder called by non-owner", async function () {
    await expect(
      contract.connect(player1).setTokenHolder(player2.address)
    ).to.be.revertedWith("ONLY_OWNER");
  });

  it("should allow token holder to pass token to player2", async function () {
    await contract.connect(player1).passToken(player2.address);
    expect(await contract.tokenHolder()).to.equal(player2.address);
  });

  it("should revert if non token holder tries to pass token", async function () {
    await expect(
      contract.connect(player1).passToken(player2.address)
    ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
  });

  it("should revert on wrong guess", async function () {
    await expect(
      contract.connect(player2).guess("wrong", funds, newSecretHash)
    ).to.be.revertedWith("WRONG_GUESS");
  });

  it("should pay out player on correct guess and reset secret", async function () {
    const requested     = ethers.utils.parseEther("0.5");
    const balanceBefore = await ethers.provider.getBalance(player2.address);

    const tx      = await contract.connect(player2).guess(secret, requested, newSecretHash);
    const receipt = await tx.wait();

    const balanceAfter = await ethers.provider.getBalance(player2.address);

    // vérifie que le joueur a bien reçu les fonds (balance augmentée, moins le gas)
    expect(balanceAfter).to.be.gt(balanceBefore);
    // vérifie que le secret a bien été reset
    expect(await contract.secretHash()).to.equal(newSecretHash);
  });

  it("should revert if guess amount exceeds contract balance", async function () {
    await expect(
      contract.connect(player2).guess(newSecret, ethers.utils.parseEther("999"), newSecretHash)
    ).to.be.revertedWith("INSUFFICIENT_CONTRACT_BALANCE");
  });

});