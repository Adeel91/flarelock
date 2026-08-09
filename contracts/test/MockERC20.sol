// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract MockERC20 {
    string public name = "Mock FXRP";
    string public symbol = "mFXRP";

    uint8 public constant decimals = 6;

    mapping(address account => uint256 amount) public balanceOf;

    mapping(address owner => mapping(address spender => uint256 amount)) public allowance;

    function mint(address account, uint256 amount) external {
        balanceOf[account] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;

        return true;
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);

        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        uint256 permitted = allowance[sender][msg.sender];

        require(permitted >= amount, "insufficient allowance");

        allowance[sender][msg.sender] = permitted - amount;

        _transfer(sender, recipient, amount);

        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) private {
        require(balanceOf[sender] >= amount, "insufficient balance");

        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
    }
}
