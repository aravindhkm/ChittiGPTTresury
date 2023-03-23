const hre = require("hardhat");

async function main() {

  
  let poolHarborLogic = "0x9ad75D01C4e975dD7dBBbc28b904Ad4fB548f50a";
  let poolHarborProxy = "";
  let tokenAddress = "0x9B02a70546f117e6A7d0f541233c8538A1b9b36e"
  const proxyAdmin = "0x041aB2c3e09423C954CCE80cECE5143120E33729";
  const calldata = 0x8129fc1c;
  const tresury = "0x36Ee7371c5D0FA379428321b9d531a1cf0a5cAE6";



  const logic = await hre.ethers.getContractFactory("PoolHarborV2");
  const logicInstance = await logic.deploy();
  await logicInstance.deployed();
  poolHarborLogic = logicInstance.address;
  console.log("logic deployed to:", poolHarborLogic); 

  await hre.run("verify:verify", {
    address: poolHarborLogic,
    constructorArguments: [],
  });

  // const proxy = await hre.ethers.getContractFactory("PoolHarborV2Proxy");
  // const proxyInstance = await proxy.deploy(poolHarborLogic,proxyAdmin,calldata);
  // await proxyInstance.deployed();
  // poolHarborProxy = proxyInstance.address;
  // console.log("proxy deployed to:", poolHarborProxy); 

 

  // await hre.run("verify:verify", {
  //   address: poolHarborProxy,
  //   constructorArguments: [poolHarborLogic,proxyAdmin,calldata],
  // });

  // const dToken = await hre.ethers.getContractFactory("Dapple");
  // const tokenInstance = await dToken.deploy(tresury);
  // await tokenInstance.deployed();
  // tokenAddress = tokenInstance.address;
  // console.log("proxy deployed to:", tokenAddress); 

  // await hre.run("verify:verify", {
  //   address: tokenAddress,
  //   constructorArguments: [tresury],
  // });


  // tokenproxy


  // const tProxy = await hre.ethers.getContractFactory("TokenProxy");
  // const tokenProxy = await tProxy.deploy(goldTokenContract,"0x3d079b51EA706c9a7A40bc62e9CBF836060984Cd",callDataForToken);
  // await tokenProxy.deployed();
  // tokenProxyContract = tokenProxy.address;
  // console.log("IterableMapping deployed to:", tokenProxyContract); 
  //  await hre.run("verify:verify", {
  //   address: "0xD4C3f4D589AF6877D54d620e351108C82E465fD9",
  //   constructorArguments: [goldTokenContract,"0x3d079b51EA706c9a7A40bc62e9CBF836060984Cd",callDataForToken],
  // });

  // pool Proxy

  // const pProxy = await hre.ethers.getContractFactory("RewardPoolProxy");
  // const poolProxy = await pProxy.deploy(rewardPool,"0x3d079b51EA706c9a7A40bc62e9CBF836060984Cd",callDataForPool);
  // await poolProxy.deployed();
  // poolProxyContract = poolProxy.address;
  // console.log("IterableMapping deployed to:", poolProxyContract); 
  //  await hre.run("verify:verify", {
  //   address: poolProxyContract,
  //   constructorArguments: [rewardPool,"0x3d079b51EA706c9a7A40bc62e9CBF836060984Cd",callDataForPool],
  // });


  // reward pool

  //  await hre.run("verify:verify", {
  //   address: "0x0AA6ec112Ea7CEd3A920833Cae66f5A7424eFabF",
  //   constructorArguments: [],
  // });


  //   const proxy = await hre.ethers.getContractFactory("TestToken");
  // const proxyInstance = await proxy.deploy();
  // await proxyInstance.deployed();
  // poolHarborProxy = proxyInstance.address;
  // console.log("proxy deployed to:", poolHarborProxy); 

  // await hre.run("verify:verify", {
  //   address: poolHarborLogic,
  //   constructorArguments: [],
  // });

}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});




