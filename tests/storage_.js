/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

let accounts;
let owner;
let player1;
let player2;
let guessingGame;
let contract;

// ─── Constants ───────────────────────────────────────────────────────────────

const secret        = "hello";
const secretBytes   = ethers.utils.formatBytes32String(secret);
const secretHash    = ethers.utils.keccak256(secretBytes);

const newSecret      = "world";
const newSecretBytes = ethers.utils.formatBytes32String(newSecret);
const newSecretHash  = ethers.utils.keccak256(newSecretBytes);

const funds = ethers.utils.parseEther("1.0");

// ─── Setup ───────────────────────────────────────────────────────────────────

before(async function () {
  accounts     = await ethers.getSigners();
  owner        = accounts[0];
  player1      = accounts[1];
  player2      = accounts[2];
  guessingGame = await ethers.getContractFactory("GuessingGame");
  contract     = await guessingGame.deploy();
  await contract.deployed();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("GuessingGame", function () {

  // init
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

  // setTokenHolder
  it("should set token holder to player1", async function () {
    await contract.connect(owner).setTokenHolder(player1.address);
    expect(await contract.tokenHolder()).to.equal(player1.address);
  });

  it("should revert if setTokenHolder called by non-owner", async function () {
    await expect(
      contract.connect(player1).setTokenHolder(player2.address)
    ).to.be.revertedWith("ONLY_OWNER");
  });

  // passToken
  it("should allow token holder to pass token to player2", async function () {
    await contract.connect(player1).passToken(player2.address);
    expect(await contract.tokenHolder()).to.equal(player2.address);
  });

  it("should revert if non token holder tries to pass token", async function () {
    await expect(
      contract.connect(player1).passToken(player2.address)
    ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
  });

  // guess — wrong
  it("should revert on wrong guess", async function () {
    await expect(
      contract.connect(player2).guess("wrong", funds, newSecretHash)
    ).to.be.revertedWith("WRONG_GUESS");
  });

  // guess — correct
  it("should pay out player on correct guess and reset secret", async function () {
    const requested      = ethers.utils.parseEther("0.5");
    const balanceBefore  = await ethers.provider.getBalance(player2.address);

    const tx      = await contract.connect(player2).guess(secret, requested, newSecretHash);
    const receipt = await tx.wait();
    const gasPrice = receipt.effectiveGasPrice ?? tx.gasPrice;
    const gasUsed = receipt.gasUsed.mul(gasPrice);

    const balanceAfter = await ethers.provider.getBalance(player2.address);

    expect(balanceAfter).to.equal(balanceBefore.add(requested).sub(gasUsed));
    expect(await contract.secretHash()).to.equal(newSecretHash);
  });

  it("should revert if guess amount exceeds contract balance", async function () {
    await expect(
      contract.connect(player2).guess(newSecret, ethers.utils.parseEther("999"), newSecretHash)
    ).to.be.revertedWith("INSUFFICIENT_CONTRACT_BALANCE");
  });

  // ownerWithdraw
  it("should allow owner to withdraw funds", async function () {
    const amount         = ethers.utils.parseEther("0.1");
    const balanceBefore  = await ethers.provider.getBalance(owner.address);

    const tx      = await contract.connect(owner).ownerWithdraw(amount, owner.address);
    const receipt = await tx.wait();
    const gasPrice = receipt.effectiveGasPrice ?? tx.gasPrice;
    const gasUsed = receipt.gasUsed.mul(gasPrice);

    const balanceAfter = await ethers.provider.getBalance(owner.address);
    expect(balanceAfter).to.equal(balanceBefore.add(amount).sub(gasUsed));
  });

  it("should revert if non-owner tries to withdraw", async function () {
    await expect(
      contract.connect(player1).ownerWithdraw(funds, player1.address)
    ).to.be.revertedWith("ONLY_OWNER");
  });

});