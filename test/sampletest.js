
const {expectEvent,time,expectRevert, BN} = require("@openzeppelin/test-helpers");
const { artifacts, web3 } = require("hardhat");
const { expect } = require("chai");
const { ethers }  = require('ethers');
const assert = require("assert");
const { parseEther } = ethers.utils;
const chittiTresuryArtifacts = artifacts.require("ChittiTresury");
const chittiTokenArtifacts = artifacts.require("ChittiGPT");
const tether = artifacts.require("TetherToken");
const mock = artifacts.require("MyToken");
const wbnb = artifacts.require("WBNB");
const router = artifacts.require("UniswapV2Router02");
const factory = artifacts.require("UniswapV2Factory");

contract("PoolHarbor_V2", (accounts) => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const uint256Max = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
  const owner = accounts[0];
  const executor = accounts[1];
  before(async function () {
    usdtToken = await tether.new(
      "1000000000000000",
      "tether token",
      "usdt",
      "6", {
        from: owner
      }
    );
    busdToken = await mock.new();
    wethInstance = await wbnb.new();
    factoryInstance = await factory.new(owner);
    routerInstance = await router.new(factoryInstance.address,wethInstance.address);  
    chittiToken = await chittiTokenArtifacts.new(owner);
    chittiTresury = await chittiTresuryArtifacts.new(chittiToken.address);

  });
  describe("[Testcase 1 : poolHarborUsdt]", () => {

    it("add liquidity", async function () {
      let usdtamount = 5000e6;
      let busdamount = parseEther("4500");
      let chittiamount = parseEther("1000");

      await usdtToken.approve(routerInstance.address,uint256Max, {from: owner});
      await busdToken.approve(routerInstance.address,uint256Max, {from: owner});
      await chittiToken.approve(routerInstance.address,uint256Max, {from: owner});
      await chittiTresury.setDexRouter(routerInstance.address, {from: owner});
      await routerInstance.addLiquidityETH(
          usdtToken.address,
          usdtamount,
          0,
          0,
          owner,
          owner,{
              from: owner,
              value: 10e18
          }
      );
      await routerInstance.addLiquidityETH(
        busdToken.address,
        busdamount,
        0,
        0,
        owner,
        owner,{
            from: owner,
            value: 10e18
        }
      );
      await routerInstance.addLiquidityETH(
        chittiToken.address,
        chittiamount,
        0,
        0,
        owner,
        owner,{
            from: owner,
            value: 10e18
        }
      );
      await routerInstance.addLiquidity(
        chittiToken.address,
        usdtToken.address,
        parseEther("1000"),
        1000e6,
        0,
        0,
        owner,
        owner,{
            from: owner
        }
      );

      await routerInstance.addLiquidity(
        chittiToken.address,
        busdToken.address,
        parseEther("1000"),
        parseEther("2000"),
        0,
        0,
        owner,
        owner,{
            from: owner
        }
      );

      // const pair1 = await factoryInstance.getPair(wethInstance.address,manaToken.address);
      // const pair2 = await factoryInstance.getPair(wethInstance.address,usdt.address);
      // const pair3 = await factoryInstance.getPair(wethInstance.address,galaToken.address);
      // const pair4 = await factoryInstance.getPair(wethInstance.address,dappleToken.address);

      // console.log("token", {
      //   "manaToken": manaToken.address,
      //   "usdt": usdt.address,
      //   "galaToken": galaToken.address,
      //   "dapple": dappleToken.address,
      //   "weth": wethInstance.address
      // })

      // console.log("pair", {
      //   "mana-wbnb": pair1,
      //   "usdt-wbnb": pair2,
      //   "gala-wbnb": pair3,
      //   "dapple-wbnb": pair4
      // })
    }); 


    it("buyBack-Revert", async function () { 
      await web3.eth.sendTransaction({from: owner, to: chittiTresury.address, value: 3e18 });
      expect(Number(await web3.eth.getBalance(chittiTresury.address))).to.equal(Number(4e18));

      const minAmountIn = "10000000000000000"; // 0.01 ether
      await expectRevert(chittiTresury.buyBack(minAmountIn,0, {from: owner}), "InvalidAmount()");
      const maxAmountIn = parseEther("20000"); // 20000 ether
      await expectRevert(chittiTresury.buyBack(maxAmountIn,0, {from: owner}), "InvalidAmount()");

      const validAmountIn = parseEther("5"); // 5 ether
      await expectRevert(chittiTresury.buyBack(validAmountIn,0, {from: accounts[2]}), "OnlyCaller()");
    })

    it("buyBack", async function () { 
      const amountIn = parseEther("2");
      await web3.eth.sendTransaction({from: owner, to: chittiTresury.address, value: 3e18 });

      const getAmountOut = await routerInstance.getAmountsOut(amountIn,[wethInstance.address,chittiToken.address]);
      expect(Number(amountIn)).to.equal(Number(getAmountOut[0]));

      const beforeChittiBalance = await chittiToken.balanceOf(chittiTresury.address);
      await chittiTresury.buyBack(amountIn,0, {from: owner});
      const afterChittiBalance = await chittiToken.balanceOf(chittiTresury.address);
      expect(parseInt(getAmountOut[1]/1e18)).to.equal(parseInt((afterChittiBalance - beforeChittiBalance)/1e18));

      expect(Number(await web3.eth.getBalance(chittiTresury.address))).to.equal(Number(1e18));
    })

    it("buyBack & Burn", async function () { 
      const amountIn = parseEther("2");
      await web3.eth.sendTransaction({from: owner, to: chittiTresury.address, value: 3e18 });

      const getAmountOut = await routerInstance.getAmountsOut(amountIn,[wethInstance.address,chittiToken.address]);
      expect(Number(amountIn)).to.equal(Number(getAmountOut[0]));

      const beforeChittiBalance = await chittiToken.balanceOf(chittiTresury.address);
      await chittiTresury.buyBackAndBurn(amountIn,0, {from: owner});
      const afterChittiBalance = await chittiToken.balanceOf(chittiTresury.address);

      expect(Number(afterChittiBalance)).to.equal(Number(beforeChittiBalance));

    //  expect(parseInt(getAmountOut[1]/1e18)).to.equal(parseInt((afterChittiBalance - beforeChittiBalance)/1e18));

     // expect(Number(await web3.eth.getBalance(chittiTresury.address))).to.equal(Number(1e18));
    })

  }) 
  
})
  
  
  
  