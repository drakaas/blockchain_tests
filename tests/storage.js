/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const secret     = "hello";
const secretBytes = ethers.utils.formatBytes32String(secret);
const secretHash = ethers.utils.keccak256(ethers.utils.solidityPack(["bytes32"], [secretBytes]));

const newSecret     = "world";
const newSecretBytes = ethers.utils.formatBytes32String(newSecret);
const newSecretHash = ethers.utils.keccak256(ethers.utils.solidityPack(["bytes32"], [newSecretBytes]));

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
describe("GuessingGame", function () {

  describe("init", function () {
    it("should not allow to guess if not initialized", async function () {
      await expect(
        contract.connect(owner).guess(secret, ethers.utils.parseEther("0.1"), newSecretHash)
      ).to.be.revertedWith("NOT_INITIALIZED");
    });

    it("should not init with 0", async function () {
      const fresh = await guessingGame.deploy();
      await fresh.deployed();
      await expect(
        fresh.connect(owner).init(secretHash, { value: 0 })
      ).to.be.revertedWith("INIT_REQUIRES_FUNDS");
    });

    it("should not init with empty secret", async function () {
      const fresh = await guessingGame.deploy();
      await fresh.deployed();
      await expect(
        fresh.connect(owner).init(ethers.constants.HashZero, { value: funds })
      ).to.be.revertedWith("INVALID_SECRET_HASH");
    });

    it("only owner can init", async function () {
      const fresh = await guessingGame.deploy();
      await fresh.deployed();
      await expect(
        fresh.connect(player1).init(secretHash, { value: funds })
      ).to.be.revertedWith("ONLY_OWNER");
    });

    it("should init the game (post conditions)", async function () {
      await contract.connect(owner).init(secretHash, { value: funds });

      expect(await contract.initialized()).to.equal(true);
      expect(await contract.tokenHolder()).to.equal(owner.address);
      expect(await contract.secretHash()).to.equal(secretHash);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(funds);
    });

    it("should not init again if initialized", async function () {
      await expect(
        contract.connect(owner).init(secretHash, { value: funds })
      ).to.be.revertedWith("ALREADY_INITIALIZED");
    });
  });

  describe("give token (passToken)", function () {
    it("should not allow to pass if not token holder", async function () {
      await expect(
        contract.connect(player1).passToken(player2.address)
      ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
    });

    it("should not allow to give token if not initialized", async function () {
      const fresh = await guessingGame.deploy();
      await fresh.deployed();
      await expect(
        fresh.connect(owner).passToken(player1.address)
      ).to.be.revertedWith("NOT_INITIALIZED");
    });

    it("to != 0", async function () {
      await expect(
        contract.connect(owner).passToken(ethers.constants.AddressZero)
      ).to.be.revertedWith("INVALID_TO");
    });

    it("to != token holder", async function () {
      await expect(
        contract.connect(owner).passToken(owner.address)
      ).to.be.revertedWith("ALREADY_TOKEN_HOLDER");
    });

    it("after changing the state: token holder = to", async function () {
      await contract.connect(owner).passToken(player1.address);
      expect(await contract.tokenHolder()).to.equal(player1.address);
    });
  });

  describe("guess", function () {
    it("should not allow to guess if not token holder", async function () {
      await expect(
        contract.connect(owner).guess(secret, ethers.utils.parseEther("0.1"), newSecretHash)
      ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
    });

    it("should not allow to guess with amount > balance", async function () {
      await expect(
        contract.connect(player1).guess(secret, ethers.utils.parseEther("999"), newSecretHash)
      ).to.be.revertedWith("INSUFFICIENT_CONTRACT_BALANCE");
    });

    it("should not allow to guess with amount = 0", async function () {
      await expect(
        contract.connect(player1).guess(secret, 0, newSecretHash)
      ).to.be.revertedWith("INVALID_AMOUNT");
    });

    it("should not allow to guess with newhash = 0", async function () {
      await expect(
        contract.connect(player1).guess(secret, ethers.utils.parseEther("0.1"), ethers.constants.HashZero)
      ).to.be.revertedWith("INVALID_NEW_SECRET_HASH");
    });

    it("should revert with wrong guess", async function () {
      await expect(
        contract.connect(player1).guess("wrong", ethers.utils.parseEther("0.1"), newSecretHash)
      ).to.be.revertedWith("WRONG_GUESS");
    });

  it("if guess was successful: secret updated, balance decreased, player balance increased; owner/tokenHolder/initialized unchanged", async function () {
    const requested = ethers.utils.parseEther("0.5");

    const ownerBefore = await contract.owner();
    const tokenHolderBefore = await contract.tokenHolder();
    const initializedBefore = await contract.initialized();

    const contractBalBefore = await ethers.provider.getBalance(contract.address);

    // Execute + assert balances + event
    await expect(
      contract.connect(player1).guess(secret, requested, newSecretHash)
    )
      .to.changeEtherBalances(
        [contract.address, player1.address],
        [requested.mul(-1), requested]
      )
      .and.to.emit(contract, "GuessedCorrectly")
      .withArgs(player1.address, requested, newSecretHash);

    //  Post-state checks
    const contractBalAfter = await ethers.provider.getBalance(contract.address);

    expect(await contract.secretHash()).to.equal(newSecretHash);
    expect(contractBalAfter).to.equal(contractBalBefore.sub(requested));

    expect(await contract.owner()).to.equal(ownerBefore);
    expect(await contract.tokenHolder()).to.equal(tokenHolderBefore);
    expect(await contract.initialized()).to.equal(initializedBefore);
  });


    it("should not allow to guess twice in a row", async function () {
      await expect(
        contract.connect(player1).guess(newSecret, ethers.utils.parseEther("0.1"), secretHash)
      ).to.be.revertedWith("NO_CONSECUTIVE_GUESS");
    });
  });
});