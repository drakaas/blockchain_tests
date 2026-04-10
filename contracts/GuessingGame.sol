/*
    Ce fichier ça sera pour notre contrat du projet du module 2 de blockchain 
 */

pragma solidity ^0.8.20;

contract GuessingGame {
    address public owner;
    address public tokenHolder;
    bytes32 public secretHash;
    bool public initialized;
    address public lastGuesser;

    event Initialized(address indexed owner, bytes32 indexed secretHash, uint256 balance);
    event TokenHolderSet(address indexed tokenHolder);
    event TokenPassed(address indexed from, address indexed to);
    event GuessedCorrectly(address indexed player, uint256 amount, bytes32 indexed newSecretHash);
    event Deposit(address indexed from, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyTokenHolder() {
        require(msg.sender == tokenHolder, "ONLY_TOKEN_HOLDER");
        _;
    }

    modifier onlyInitialized() {
        require(initialized, "NOT_INITIALIZED");
        _;
    }

    function _stringToBytes32(string memory value) internal pure returns (bytes32 result) {
        assembly {
            result := mload(add(value, 32))
        }
    }

    constructor() {
        owner = msg.sender;
    }

    function init(bytes32 initialSecretHash) external payable onlyOwner {
        require(!initialized, "ALREADY_INITIALIZED");
        require(initialSecretHash != bytes32(0), "INVALID_SECRET_HASH");
        require(msg.value > 0, "INIT_REQUIRES_FUNDS");
        secretHash = initialSecretHash;
        initialized = true;
        tokenHolder = owner;
        emit Initialized(owner, secretHash, address(this).balance);
    }
lastGuesser = msg
    function setTokenHolder(address holder) external onlyOwner {
        require(holder != address(0), "INVALID_TOKEN_HOLDER");
        tokenHolder = holder;
        emit TokenHolderSet(holder);
    }

    function passToken(address to) external onlyInitialized onlyTokenHolder {
        require(to != address(0), "INVALID_TO");
        require(to != tokenHolder, "ALREADY_TOKEN_HOLDER");
        address old = tokenHolder;
        tokenHolder = to;
        lastGuesser = address(0);
        emit TokenPassed(old, to);
    }

    function guess(string calldata plainSecret, uint256 requestedAmount, bytes32 newSecretHash)
        external
        onlyInitialized
        onlyTokenHolder
    {
        require(requestedAmount > 0, "INVALID_AMOUNT");
        require(newSecretHash != bytes32(0), "INVALID_NEW_SECRET_HASH");
        require(msg.sender != lastGuesser, "NO_CONSECUTIVE_GUESS");
        bytes32 secretBytes = _stringToBytes32(plainSecret);
        require(keccak256(abi.encodePacked(secretBytes)) == secretHash, "WRONG_GUESS");
        require(address(this).balance >= requestedAmount, "INSUFFICIENT_CONTRACT_BALANCE");

        secretHash = newSecretHash;
        lastGuesser = msg.sender;

        (bool ok, ) = payable(msg.sender).call{value: requestedAmount}("");
        require(ok, "PAYOUT_FAILED");

        emit GuessedCorrectly(msg.sender, requestedAmount, newSecretHash);
    }
}string calldata plainSecret, uint256 requestedAmount, bytes32 newSecretHash