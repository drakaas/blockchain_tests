/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const secret      = "hello";
const secretHash  = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));

const newSecret      = "world";
const newSecretHash  = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(newSecret));

const thirdSecret      = "remix";
const thirdSecretHash  = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(thirdSecret));

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

  // ─── constructor ─────────────────────────────────────────────────────────

  it("1. should set owner to deployer", async function () {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("2. should set initialized to false after deploy", async function () {
    expect(await contract.initialized()).to.equal(false);
  });

  // ─── init ────────────────────────────────────────────────────────────────

  it("3. should revert init if called by non-owner", async function () {
    await expect(
      contract.connect(player1).init(secretHash, { value: funds })
    ).to.be.revertedWith("ONLY_OWNER");
  });

  it("4. should revert init if called without funds", async function () {
    await expect(
      contract.connect(owner).init(secretHash, { value: 0 })
    ).to.be.revertedWith("INIT_REQUIRES_FUNDS");
  });

  it("5. should revert init if secret hash is zero", async function () {
    await expect(
      contract.connect(owner).init(ethers.constants.HashZero, { value: funds })
    ).to.be.revertedWith("INVALID_SECRET_HASH");
  });

  it("6. should init correctly with valid params", async function () {
    const oldBalance = await ethers.provider.getBalance(contract.address);
    await contract.connect(owner).init(secretHash, { value: funds });
    const newBalance = await ethers.provider.getBalance(contract.address);
    expect(await contract.initialized()).to.equal(true);
    expect(await contract.secretHash()).to.equal(secretHash);
    expect(await contract.tokenHolder()).to.equal(owner.address);
    expect(newBalance).to.equal(oldBalance.add(funds));
  });

  it("7. should revert init if already initialized", async function () {
    await expect(
      contract.connect(owner).init(secretHash, { value: funds })
    ).to.be.revertedWith("ALREADY_INITIALIZED");
  });

  // ─── setTokenHolder ──────────────────────────────────────────────────────

  it("8. should revert setTokenHolder if called by non-owner", async function () {
    await expect(
      contract.connect(player1).setTokenHolder(player2.address)
    ).to.be.revertedWith("ONLY_OWNER");
  });

  it("9. should revert setTokenHolder with zero address", async function () {
    await expect(
      contract.connect(owner).setTokenHolder(ethers.constants.AddressZero)
    ).to.be.revertedWith("INVALID_TOKEN_HOLDER");
  });

  it("10. should set token holder to player1", async function () {
    await contract.connect(owner).setTokenHolder(player1.address);
    expect(await contract.tokenHolder()).to.equal(player1.address);
  });

  it("11. should allow owner to reassign token holder to another player", async function () {
    await contract.connect(owner).setTokenHolder(player2.address);
    expect(await contract.tokenHolder()).to.equal(player2.address);
    // reset back to player1 for next tests
    await contract.connect(owner).setTokenHolder(player1.address);
    expect(await contract.tokenHolder()).to.equal(player1.address);
  });

  // ─── passToken ───────────────────────────────────────────────────────────

  it("12. should revert passToken if contract not initialized", async function () {
    const fresh = await (await ethers.getContractFactory("GuessingGame")).deploy();
    await fresh.deployed();
    await expect(
      fresh.connect(owner).passToken(player1.address)
    ).to.be.revertedWith("NOT_INITIALIZED");
  });

  it("13. should revert passToken if caller is not token holder", async function () {
    await expect(
      contract.connect(player2).passToken(player3.address)
    ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
  });

  it("14. should revert passToken with zero address", async function () {
    await expect(
      contract.connect(player1).passToken(ethers.constants.AddressZero)
    ).to.be.revertedWith("INVALID_TO");
  });

  it("15. should allow token holder to pass token to player2", async function () {
    await contract.connect(player1).passToken(player2.address);
    expect(await contract.tokenHolder()).to.equal(player2.address);
  });

  it("16. should revert passToken after token has been passed (old holder)", async function () {
    await expect(
      contract.connect(player1).passToken(player3.address)
    ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
  });

  it("17. should allow new token holder to pass token again", async function () {
    await contract.connect(player2).passToken(player1.address);
    expect(await contract.tokenHolder()).to.equal(player1.address);
  });

  // ─── deposit ─────────────────────────────────────────────────────────────

  it("18. should accept deposit via deposit() and increase balance", async function () {
    const before = await ethers.provider.getBalance(contract.address);
    const amount = ethers.utils.parseEther("0.5");
    await contract.connect(player2).deposit({ value: amount });
    const after = await ethers.provider.getBalance(contract.address);
    expect(after).to.equal(before.add(amount));
  });

  it("19. should accept ETH via receive() and increase balance", async function () {
    const before = await ethers.provider.getBalance(contract.address);
    const amount = ethers.utils.parseEther("0.2");
    await owner.sendTransaction({ to: contract.address, value: amount });
    const after = await ethers.provider.getBalance(contract.address);
    expect(after).to.equal(before.add(amount));
  });

  // ─── guess ───────────────────────────────────────────────────────────────

  it("20. should revert guess if contract not initialized", async function () {
    const fresh = await (await ethers.getContractFactory("GuessingGame")).deploy();
    await fresh.deployed();
    await expect(
      fresh.connect(owner).guess(secret, ethers.utils.parseEther("0.1"), newSecretHash)
    ).to.be.revertedWith("NOT_INITIALIZED");
  });

  it("21. should revert guess if caller is not token holder", async function () {
    await expect(
      contract.connect(player2).guess(secret, ethers.utils.parseEther("0.1"), newSecretHash)
    ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
  });

  it("22. should revert guess if new secret hash is zero", async function () {
    await expect(
      contract.connect(player1).guess(secret, ethers.utils.parseEther("0.1"), ethers.constants.HashZero)
    ).to.be.revertedWith("INVALID_NEW_SECRET_HASH");
  });

  it("23. should revert guess if amount exceeds contract balance", async function () {
    await expect(
      contract.connect(player1).guess(secret, ethers.utils.parseEther("999"), newSecretHash)
    ).to.be.revertedWith("INSUFFICIENT_CONTRACT_BALANCE");
  });

  it("24. should revert guess if plain secret is wrong", async function () {
    await expect(
      contract.connect(player1).guess("wrongword", ethers.utils.parseEther("0.1"), newSecretHash)
    ).to.be.revertedWith("WRONG_GUESS");
  });

  it("25. should revert guess if plain secret is empty string", async function () {
    await expect(
      contract.connect(player1).guess("", ethers.utils.parseEther("0.1"), newSecretHash)
    ).to.be.revertedWith("WRONG_GUESS");
  });

  it("26. should pay out player on correct guess and update secret", async function () {
    const requested     = ethers.utils.parseEther("0.5");
    const balanceBefore = await ethers.provider.getBalance(player1.address);

    const tx = await contract.connect(player1).guess(secret, requested, newSecretHash);
    await tx.wait();

    const balanceAfter = await ethers.provider.getBalance(player1.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
    expect(await contract.secretHash()).to.equal(newSecretHash);
  });

  it("27. should decrease contract balance after correct guess", async function () {
    const requested      = ethers.utils.parseEther("0.3");
    const balanceBefore  = await ethers.provider.getBalance(contract.address);

    // pass token to player1 first (player1 still holds it after test 26)
    const tx = await contract.connect(player1).guess(newSecret, requested, thirdSecretHash);
    await tx.wait();

    const balanceAfter = await ethers.provider.getBalance(contract.address);
    expect(balanceAfter).to.equal(balanceBefore.sub(requested));
  });

  it("28. should update secretHash after correct guess", async function () {
    expect(await contract.secretHash()).to.equal(thirdSecretHash);
  });

  it("29. should revert guess with old secret after reset", async function () {
    await expect(
      contract.connect(player1).guess(newSecret, ethers.utils.parseEther("0.1"), thirdSecretHash)
    ).to.be.revertedWith("WRONG_GUESS");
  });

  it("30. should allow correct guess with new secret after reset", async function () {
    const fourthSecret     = "blockchain";
    const fourthSecretHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(fourthSecret));
    const requested        = ethers.utils.parseEther("0.1");
    const balanceBefore    = await ethers.provider.getBalance(player1.address);

    const tx = await contract.connect(player1).guess(thirdSecret, requested, fourthSecretHash);
    await tx.wait();

    const balanceAfter = await ethers.provider.getBalance(player1.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
    expect(await contract.secretHash()).to.equal(fourthSecretHash);
  });

});