// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "hardhat/console.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SafeTransferLib} from "@rari-capital/solmate/src/utils/SafeTransferLib.sol";
import {ERC20} from "@rari-capital/solmate/src/tokens/ERC20.sol";

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IUniswapV2Factory} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import {IUniswapV2Pair} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";


contract ChittiTresury is AccessControl,Pausable {
    using SafeTransferLib for address;
    using SafeTransferLib for ERC20;

    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR");
    address internal constant DEAD_WALLET = 0x000000000000000000000000000000000000dEaD;
    IUniswapV2Router02 public dexRouter;
    IUniswapV2Pair public dexPair;
    ERC20 public managedToken;

    uint256 public minimumTokenToSwap = 0.1e18;
    uint256 public maximumTokenToSwap = 10000e18;
    uint256 public minimumEthToSwap = 0.1e18;
    uint256 public maximumEthToSwap = 10000e18;

    error ZeroAmount();
    error ZeroAddress();
    error InvalidAmount();
    error OnlyCaller();

    modifier onlyCaller() {
        if(!(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(EXECUTOR_ROLE, msg.sender))) {
            revert OnlyCaller();
        }
        _;
    }

    constructor(address _managedToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);

        _setRoleAdmin(EXECUTOR_ROLE,DEFAULT_ADMIN_ROLE);


        managedToken = ERC20(_managedToken);
    }

    receive() external payable {}

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setDexRouter(address newRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(newRouter == address(0)) revert ZeroAddress();

        dexRouter = IUniswapV2Router02(newRouter);
    }

    function setDexPair(address newPair) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(newPair == address(0)) revert ZeroAddress();

        dexPair = IUniswapV2Pair(newPair);
    }    

    function setMinMaxTokenSwap(
        uint256 newMinimumTokenToSwap,
        uint256 newMaximumTokenToSwap,
        uint256 newMinimumEthToSwap,
        uint256 newMaximumEthToSwap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(newMinimumTokenToSwap == 0 || newMaximumTokenToSwap == 0) revert ZeroAmount();
        if(newMinimumEthToSwap == 0 || newMaximumEthToSwap == 0) revert ZeroAmount();

        
        minimumTokenToSwap = newMinimumTokenToSwap;
        maximumTokenToSwap = newMaximumTokenToSwap;
        minimumEthToSwap = newMinimumEthToSwap;
        maximumEthToSwap = newMaximumEthToSwap;
    }

    function setManagedToken(address newManagedToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(newManagedToken == address(0)) revert ZeroAddress();
        
        managedToken = ERC20(newManagedToken);
    }

    function recoverLeftOverEth(address to,uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(to).transfer(amount);
    }

    function recoverLeftOverToken(address token,address to,uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ERC20(token).safeTransfer(to,amount);
    }

    function buyBack(uint256 amountEth,uint256 amountOutMin) external payable onlyCaller returns (uint256 amountToken) {
        if(!(amountEth >= minimumEthToSwap && amountEth <= maximumEthToSwap)) revert InvalidAmount();

        return swapEthForTokens(amountEth,amountOutMin);
    }

    function addLiquidityEth(uint256 tokenAmount, uint256 ethAmount) external payable onlyCaller {
        addLiquidity(tokenAmount, ethAmount);
    }

    function sell(uint256 tokenAmount,uint256 amountOutMin) external onlyCaller {
        if(!(tokenAmount >= minimumTokenToSwap && tokenAmount <= maximumTokenToSwap)) revert InvalidAmount();

        swapTokensForEth(tokenAmount, amountOutMin);
    }

    function swapManagedTokenwithOther(ERC20 toToken,uint256 tokenAmount, uint256 amountOutMin) external onlyCaller {
        if(!(tokenAmount >= minimumTokenToSwap && tokenAmount <= maximumTokenToSwap)) revert InvalidAmount();

        swapTokensForToken(toToken, tokenAmount, amountOutMin);
    }

    function buyBackAndBurn(uint256 amountEth,uint256 amountOutMin) external payable onlyCaller returns (bool) {
        if(!(amountEth >= minimumEthToSwap && amountEth <= maximumEthToSwap)) revert InvalidAmount();

        burnDeadWallet(swapEthForTokens(amountEth,amountOutMin));
        return true;
    }

    function burn(uint256 amount) external onlyCaller {        
        burnDeadWallet(amount);
    }

    function burnDeadWallet(uint256 amount) internal {
        managedToken.safeTransfer(DEAD_WALLET,amount);
    }

    function swapEthForTokens(uint256 ethAmount,uint256 amountOutMin) private returns (uint256 tokenAmount) {
        address[] memory path = new address[](2);
        path[0] = dexRouter.WETH();
        path[1] = address(managedToken);

        (uint256[] memory amounts) =
            dexRouter.swapExactETHForTokens{value: ethAmount}(amountOutMin, path, address(this), block.timestamp);

        return amounts[1];
    }

     function swapTokensForToken(ERC20 toToken,uint256 tokenAmount, uint256 minAmountOut) private returns (uint256 ethAmount) {
        address[] memory path = new address[](2);
        path[0] = address(managedToken);
        path[1] = address(toToken);

        uint256 tokenBefore = toToken.balanceOf(address(this));

        managedToken.safeApprove(address(dexRouter), tokenAmount);
        dexRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            tokenAmount, minAmountOut, path, address(this), block.timestamp
        );

        uint256 tokenAfter = toToken.balanceOf(address(this));
        return tokenAfter - tokenBefore;
    }

    function swapTokensForEth(uint256 tokenAmount, uint256 minAmountOut) private returns (uint256 ethAmount) {
        address[] memory path = new address[](2);
        path[0] = address(managedToken);
        path[1] = dexRouter.WETH();

        uint256 ethBefore = address(this).balance;

        managedToken.safeApprove(address(dexRouter), tokenAmount);
        dexRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount, minAmountOut, path, address(this), block.timestamp
        );

        uint256 ethAfter = address(this).balance;
        return ethAfter - ethBefore;
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        managedToken.safeApprove(address(dexRouter), tokenAmount);

        dexRouter.addLiquidityETH{value: ethAmount}(
            address(managedToken), tokenAmount, 0, 0, address(this), block.timestamp
        );
    }
}