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


const { expect } = require("chai");
const { ethers } = require("hardhat");

<<<<<<< HEAD
const secret      = "hello";
const secretHash  = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));

const newSecret      = "world";
const newSecretHash  = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(newSecret));

const thirdSecret      = "remix";
const thirdSecretHash  = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(thirdSecret));

const funds = ethers.utils.parseEther("1.0");

let accounts, owner, player1, player2, player3, guessingGame, contract;
=======
let accounts, owner, player1, player2, guessingGame, contract;

// ─── Constants ───────────────────────────────────────────────────────────────

const secret           = "hello";
const secretHash       = ethers.utils.keccak256(ethers.utils.formatBytes32String(secret));

const newSecret        = "world";
const newSecretHash    = ethers.utils.keccak256(ethers.utils.formatBytes32String(newSecret));

const thirdSecret      = "remix";
const thirdSecretHash  = ethers.utils.keccak256(ethers.utils.formatBytes32String(thirdSecret));

const fourthSecret     = "blockchain";
const fourthSecretHash = ethers.utils.keccak256(ethers.utils.formatBytes32String(fourthSecret));

const funds = ethers.utils.parseEther("1.0");

async function deployFresh() {
  const factory = await ethers.getContractFactory("GuessingGame");
  const fresh = await factory.deploy();
  await fresh.deployed();
  return fresh;
}

// ─── Setup ───────────────────────────────────────────────────────────────────
>>>>>>> 0b369d4f1ce2912d8af97071ec019a398f27a260

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

describe("GuessingGame"), function () {

  // ─── constructor ─────────────────────────────────────────────────────────

<<<<<<< HEAD
  it("1. should set owner to deployer", async function () {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("2. should set initialized to false after deploy", async function () {
    expect(await contract.initialized()).to.equal(false);
  });
};
describe("init", function () {
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

  // should not be able to give token 

  //tests if values are still 0  if params are  not changed 

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
  
  // if adress = 0 notching changes 


  // ─── guess ───────────────────────────────────────────────────────────────

  // precondition pas valide = nothing changes 
  // can't guess 2 times suivie

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
=======
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

  });

  describe("setTokenHolder", function () {

    it("should revert if setTokenHolder called by non-owner", async function () {
      await expect(
        contract.connect(player1).setTokenHolder(player2.address)
      ).to.be.revertedWith("ONLY_OWNER");
    });

    it("should revert with zero address", async function () {
      await expect(
        contract.connect(owner).setTokenHolder(ethers.constants.AddressZero)
      ).to.be.revertedWith("INVALID_TOKEN_HOLDER");
    });

    it("should set token holder to player1", async function () {
      await contract.connect(owner).setTokenHolder(player1.address);
      expect(await contract.tokenHolder()).to.equal(player1.address);
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
        contract.connect(player2).passToken(owner.address)
      ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
    });

    it("should revert with zero address", async function () {
      await expect(
        contract.connect(player1).passToken(ethers.constants.AddressZero)
      ).to.be.revertedWith("INVALID_TO");
    });

    it("should revert if passing to same address", async function () {
      await expect(
        contract.connect(player1).passToken(player1.address)
      ).to.be.revertedWith("ALREADY_TOKEN_HOLDER");
    });

    it("should update token holder after pass", async function () {
      await contract.connect(player1).passToken(player2.address);
      expect(await contract.tokenHolder()).to.equal(player2.address);
    });

    it("should revert from old holder after transfer", async function () {
      await expect(
        contract.connect(player1).passToken(owner.address)
      ).to.be.revertedWith("ONLY_TOKEN_HOLDER");
    });

    it("should allow new token holder to pass token back to player1", async function () {
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

    it("should pay out player on correct guess and reset secret", async function () {
      const requested     = ethers.utils.parseEther("0.5");
      const balanceBefore = await ethers.provider.getBalance(player1.address);

      const tx       = await contract.connect(player1).guess(secret, requested, newSecretHash);
      const receipt  = await tx.wait();
      const gasPrice = receipt.effectiveGasPrice ?? tx.gasPrice;
      const gasUsed  = receipt.gasUsed.mul(gasPrice);

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      expect(balanceAfter).to.equal(balanceBefore.add(requested).sub(gasUsed));
      expect(await contract.secretHash()).to.equal(newSecretHash);
    });

    it("should revert consecutive guess by same player", async function () {
      await expect(
        contract.connect(player1).guess(newSecret, ethers.utils.parseEther("0.1"), thirdSecretHash)
      ).to.be.revertedWith("NO_CONSECUTIVE_GUESS");
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

  describe("liveness", function () {

    it("should allow retry after a wrong guess (eventual correct guess)", async function () {
      const fresh = await deployFresh();
      await fresh.connect(owner).init(secretHash, { value: funds });
      await fresh.connect(owner).setTokenHolder(player1.address);

      await expect(
        fresh.connect(player1).guess("wrong", ethers.utils.parseEther("0.1"), newSecretHash)
      ).to.be.revertedWith("WRONG_GUESS");

      const requested = ethers.utils.parseEther("0.1");
      await expect(
        fresh.connect(player1).guess(secret, requested, newSecretHash)
      ).to.not.be.reverted;

      expect(await fresh.secretHash()).to.equal(newSecretHash);
    });

    it("should allow same player to guess again after token passes away and back (lastGuesser reset)", async function () {
      const fresh = await deployFresh();
      await fresh.connect(owner).init(secretHash, { value: funds });
      await fresh.connect(owner).setTokenHolder(player1.address);

      await (await fresh.connect(player1).guess(secret, ethers.utils.parseEther("0.1"), newSecretHash)).wait();

      await (await fresh.connect(player1).passToken(player2.address)).wait();
      await (await fresh.connect(player2).passToken(player1.address)).wait();

      await expect(
        fresh.connect(player1).guess(newSecret, ethers.utils.parseEther("0.1"), thirdSecretHash)
      ).to.not.be.reverted;

      expect(await fresh.secretHash()).to.equal(thirdSecretHash);
    });

    it("should allow adding funds via deposit and continue guessing", async function () {
      const fresh = await deployFresh();
      await fresh.connect(owner).init(secretHash, { value: ethers.utils.parseEther("0.2") });
      await fresh.connect(owner).setTokenHolder(player1.address);

      const bal1 = await ethers.provider.getBalance(fresh.address);
      await (await fresh.connect(player2).deposit({ value: ethers.utils.parseEther("0.3") })).wait();
      const bal2 = await ethers.provider.getBalance(fresh.address);
      expect(bal2).to.equal(bal1.add(ethers.utils.parseEther("0.3")));

      await expect(
        fresh.connect(player1).guess(secret, ethers.utils.parseEther("0.4"), newSecretHash)
      ).to.not.be.reverted;
    });

>>>>>>> 0b369d4f1ce2912d8af97071ec019a398f27a260
  });

});