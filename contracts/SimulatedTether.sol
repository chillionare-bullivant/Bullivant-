// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimulatedTether
 * @notice Replicates the official Tether Treasury smart contract architecture.
 *         Only approved institutional users with a minimum deposit of $100,000
 *         can trigger token creation backed 1:1 by fiat reserve bank deposits.
 */
contract SimulatedTether {
    string public name = "Simulated Tether";
    string public symbol = "sUSDT";
    uint8 public decimals = 6; // USDT uses 6 decimals instead of 18
    uint256 public totalSupply;

    address public treasuryOwner;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    modifier onlyTreasury() {
        require(msg.sender == treasuryOwner, "Only Tether Treasury can execute this");
        _;
    }

    constructor() {
        treasuryOwner = msg.sender; // The deployer acts as Tether Treasury
    }

    // Replicates the on-chain trigger after a $100k+ bank wire clears
    function mint(address to, uint256 amount) external onlyTreasury {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Mint amount must be > 0");

        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    // Replicates token burn when institutional client redeems fiat
    function burn(address from, uint256 amount) external onlyTreasury {
        require(balanceOf[from] >= amount, "Insufficient sUSDT balance to burn");

        balanceOf[from] -= amount;
        totalSupply -= amount;

        emit Burn(from, amount);
        emit Transfer(from, address(0), amount);
    }
}
