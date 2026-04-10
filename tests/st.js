/* 
describe before init game :
    should not init again if initialized
    should not allow to guess
    should not init with 0
    should not init with empty secret
    only owner can init 
  after changing the state
    balance = funds
    token holder =owner
    secret = initsecrethash
    initialized = true 
    oldowner = newowner 


describe before givetoken :
    should not allow to pass if not token holder
    should not allo to give token if not initialized
    to != 0
    to != token holder

  after changing the state
    token holder = to
    
describe before guess:
    should not allow to guess if not initialized
    should not allow to guess if not token holder
    should not allow to guess with amount > balance
    should not allow to guess with amount = 0
    should not allow to guess with newhash = 0
    should not allow to guess twice in arow

  after changing the state
    should revert with wrong guess
    if guess was successful
      secret = newSecretHash
      balance = balance - requestedAmount
      balance joueur += requestedAmount

    owner,tokenHolder,initialized changent pas


 */

/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const secret           = "hello";
const secretHash       = ethers.utils.keccak256(ethers.utils.formatBytes32String(secret));

const newSecret        = "world";
const newSecretHash    = ethers.utils.keccak256(ethers.utils.formatBytes32String(newSecret));

const thirdSecret      = "remix";
const thirdSecretHash  = ethers.utils.keccak256(ethers.utils.formatBytes32String(thirdSecret));

const fourthSecret     = "blockchain";
const fourthSecretHash = ethers.utils.keccak256(ethers.utils.formatBytes32String(fourthSecret));

const funds = ethers.utils.parseEther("1.0");

let accounts, owner, player1, player2, player3, guessingGame, contract;

before(async function () {
  accounts     = await ethers.getSigners();
  owner        = accounts[0];
  player1      = accounts[1];
  player2      = accounts[2];
  player3      = accounts[3];
  guessingGame = await ethers.getContractFactory("GuessingGame");
  contract     = await guessingGame.deploy();
  await contract.deployed();
});

describe("GuessingGame", function () {

  describe("constructor", function () {

    it("should set owner to deployer", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should set initialized to false after deploy", async function () {
      expect(await contract.initialized()).to.equal(false);
    });

  });

  describe("init", function () {

    it("should revert if called by non-owner", async function () {
      await expect(
        contract.connect(player1).init(secretHash, { value: funds })
      ).to.be.revertedWith("ONLY_OWNER");
    });

    it("should revert if called without funds", async function () {
      await expect(
        contract.connect(owner).init(secretHash, { value: 0 })
      ).to.be.revertedWith("INIT_REQUIRES_FUNDS");
    });

    it("should revert if secret hash is zero", async function () {
      await expect(
        contract.connect(owner).init(ethers.constants.HashZero, { value: funds })
      ).to.be.revertedWith("INVALID_SECRET_HASH");
    });

    it("should not be able to give token before init", async function () {
      await expect(
        contract.connect(owner).passToken(player1.address)
      ).to.be.revertedWith("NOT_INITIALIZED");
    });

    it("should not change state if params are invalid (non-owner attempt)", async function () {
      const initializedBefore = await contract.initialized();
      const secretHashBefore  = await contract.secretHash();
      const tokenHolderBefore = await contract.tokenHolder();
      await expect(
        contract.connect(player1).init(secretHash, { value: funds })
      ).to.be.reverted;
      expect(await contract.initialized()).to.equal(initializedBefore);
      expect(await contract.secretHash()).to.equal(secretHashBefore);
      expect(await contract.tokenHolder()).to.equal(tokenHolderBefore);
    });

    it("should not change state if called without funds", async function () {
      const initializedBefore = await contract.initialized();
      const balanceBefore     = await ethers.provider.getBalance(contract.address);
      await expect(
        contract.connect(owner).init(secretHash, { value: 0 })
      ).to.be.reverted;
      expect(await contract.initialized()).to.equal(initializedBefore);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(balanceBefore);
    });

    it("should init correctly and update state", async function () {
      const oldBalance = await ethers.provider.getBalance(contract.address);
      await contract.connect(owner).init(secretHash, { value: funds });
      const newBalance = await ethers.provider.getBalance(contract.address);
      expect(await contract.initialized()).to.equal(true);
      expect(await contract.secretHash()).to.equal(secretHash);
      expect(await contract.tokenHolder()).to.equal(owner.address);
      expect(newBalance).to.equal(oldBalance.add(funds));
    });

    it("should revert if already initialized", async function () {
      await expect(
        contract.connect(owner).init(secretHash, { value: funds })
      ).to.be.revertedWith("ALREADY_INITIALIZED");
    });

    it("should not change state if called again after initialized", async function () {
      const initializedBefore = await contract.initialized();
      const secretHashBefore  = await contract.secretHash();
      const tokenHolderBefore = await contract.tokenHolder();
      const balanceBefore     = await ethers.provider.getBalance(contract.address);
      await expect(
        contract.connect(owner).init(secretHash, { value: funds })
      ).to.be.reverted;
      expect(await contract.initialized()).to.equal(initializedBefore);
      expect(await contract.secretHash()).to.equal(secretHashBefore);
      expect(await contract.tokenHolder()).to.equal(tokenHolderBefore);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(balanceBefore);
    });

  });

  describe("passToken", function () {

    it("should revert if contract not initialized", async function () {
      const fresh = await (await ethers.getContractFactory("GuessingGame")).deploy();
      await fresh.deployed();
      await expect(
        fresh.connect(owner).passToken(player1.address)
      ).to.be.revertedWith("NOT_INITIALIZED");
    });

    it("should revert if caller is not token holder", async function () {
      await expect(
        contract.connect(player1).passToken(player2.address)
      ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
    });

    it("should revert with zero address", async function () {
      await expect(
        contract.connect(owner).passToken(ethers.constants.AddressZero)
      ).to.be.revertedWith("INVALID_TO");
    });

    it("should not change state if address is zero", async function () {
      const tokenHolderBefore = await contract.tokenHolder();
      await expect(
        contract.connect(owner).passToken(ethers.constants.AddressZero)
      ).to.be.reverted;
      expect(await contract.tokenHolder()).to.equal(tokenHolderBefore);
    });

    it("should revert if passing to same address", async function () {
      await expect(
        contract.connect(owner).passToken(owner.address)
      ).to.be.revertedWith("ALREADY_TOKEN_HOLDER");
    });

    it("should update token holder after pass", async function () {
      await contract.connect(owner).passToken(player1.address);
      expect(await contract.tokenHolder()).to.equal(player1.address);
    });

    it("should revert from old holder after transfer", async function () {
      await expect(
        contract.connect(owner).passToken(player2.address)
      ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
    });

    it("should allow new token holder to pass token to player2", async function () {
      await contract.connect(player1).passToken(player2.address);
      expect(await contract.tokenHolder()).to.equal(player2.address);
    });

    it("should allow player2 to pass token back to player1", async function () {
      await contract.connect(player2).passToken(player1.address);
      expect(await contract.tokenHolder()).to.equal(player1.address);
    });

  });

  describe("guess", function () {

    it("should revert if contract not initialized", async function () {
      const fresh = await (await ethers.getContractFactory("GuessingGame")).deploy();
      await fresh.deployed();
      await expect(
        fresh.connect(owner).guess(secret, ethers.utils.parseEther("0.1"), newSecretHash)
      ).to.be.revertedWith("NOT_INITIALIZED");
    });

    it("should revert if caller is not token holder", async function () {
      await expect(
        contract.connect(player2).guess(secret, ethers.utils.parseEther("0.1"), newSecretHash)
      ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
    });

    it("should revert if amount is zero", async function () {
      await expect(
        contract.connect(player1).guess(secret, 0, newSecretHash)
      ).to.be.revertedWith("INVALID_AMOUNT");
    });

    it("should revert if new secret hash is zero", async function () {
      await expect(
        contract.connect(player1).guess(secret, ethers.utils.parseEther("0.1"), ethers.constants.HashZero)
      ).to.be.revertedWith("INVALID_NEW_SECRET_HASH");
    });

    it("should revert if amount exceeds contract balance", async function () {
      await expect(
        contract.connect(player1).guess(secret, ethers.utils.parseEther("999"), newSecretHash)
      ).to.be.revertedWith("INSUFFICIENT_CONTRACT_BALANCE");
    });

    it("should revert if plain secret is wrong", async function () {
      await expect(
        contract.connect(player1).guess("wrongword", ethers.utils.parseEther("0.1"), newSecretHash)
      ).to.be.revertedWith("WRONG_GUESS");
    });

    it("should not change state if precondition fails", async function () {
      const secretHashBefore  = await contract.secretHash();
      const balanceBefore     = await ethers.provider.getBalance(contract.address);
      const tokenHolderBefore = await contract.tokenHolder();
      const ownerBefore       = await contract.owner();
      const initializedBefore = await contract.initialized();
      await expect(
        contract.connect(player1).guess("wrongword", ethers.utils.parseEther("0.1"), newSecretHash)
      ).to.be.reverted;
      expect(await contract.secretHash()).to.equal(secretHashBefore);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(balanceBefore);
      expect(await contract.tokenHolder()).to.equal(tokenHolderBefore);
      expect(await contract.owner()).to.equal(ownerBefore);
      expect(await contract.initialized()).to.equal(initializedBefore);
    });

    it("should pay out player and reset secret on correct guess", async function () {
      const requested     = ethers.utils.parseEther("0.5");
      const balanceBefore = await ethers.provider.getBalance(player1.address);

      const tx = await contract.connect(player1).guess(secret, requested, newSecretHash);
      await tx.wait();

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
      expect(await contract.secretHash()).to.equal(newSecretHash);
    });

    it("should not change owner, tokenHolder or initialized after correct guess", async function () {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.tokenHolder()).to.equal(player1.address);
      expect(await contract.initialized()).to.equal(true);
    });

    it("should revert consecutive guess by same player", async function () {
      await expect(
        contract.connect(player1).guess(newSecret, ethers.utils.parseEther("0.1"), thirdSecretHash)
      ).to.be.revertedWith("NO_CONSECUTIVE_GUESS");
    });

    it("should not change state after consecutive guess attempt", async function () {
      const secretHashBefore = await contract.secretHash();
      const balanceBefore    = await ethers.provider.getBalance(contract.address);
      await expect(
        contract.connect(player1).guess(newSecret, ethers.utils.parseEther("0.1"), thirdSecretHash)
      ).to.be.reverted;
      expect(await contract.secretHash()).to.equal(secretHashBefore);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(balanceBefore);
    });

    it("should decrease contract balance after correct guess", async function () {
      await contract.connect(player1).passToken(player2.address);
      const requested     = ethers.utils.parseEther("0.3");
      const balanceBefore = await ethers.provider.getBalance(contract.address);

      const tx = await contract.connect(player2).guess(newSecret, requested, thirdSecretHash);
      await tx.wait();

      const balanceAfter = await ethers.provider.getBalance(contract.address);
      expect(balanceAfter).to.equal(balanceBefore.sub(requested));
      expect(await contract.secretHash()).to.equal(thirdSecretHash);
    });

    it("should allow correct guess with new secret after reset", async function () {
      await contract.connect(player2).passToken(player1.address);
      const requested     = ethers.utils.parseEther("0.1");
      const balanceBefore = await ethers.provider.getBalance(player1.address);

      const tx = await contract.connect(player1).guess(thirdSecret, requested, fourthSecretHash);
      await tx.wait();

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
      expect(await contract.secretHash()).to.equal(fourthSecretHash);
    });

  });

});