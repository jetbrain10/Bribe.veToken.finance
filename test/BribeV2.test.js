const chai = require('chai');
const {expect} = require('chai');
const {ethers} = require('hardhat');
const {solidity} = require('ethereum-waffle');

chai.use(solidity);

const fee = 10;
const project = 'CRV';

describe.only('BribeV2 ', function() {
  let owner, newOwner, Bribe, bribe;
  let gaugeControllerAddress, gaugeAddress, rewardtokenAddress, veAddress, claimAddress;

  switch (project) {
    case 'FRAX':
      gaugeControllerAddress = '0x3669C421b77340B2979d1A00a792CC2ee0FcE737';
      gaugeAddress = '0x3EF26504dbc8Dd7B7aa3E97Bc9f3813a9FC0B4B0';
      rewardtokenAddress = '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0'; // FXS
      claimAddress = '0x3eF498e7F978793b3Da6930ABcc416a86cA6ee18';
      veAddress = '0xc8418aF6358FFddA74e09Ca9CC3Fe03Ca6aDC5b0'; //veFXS
      break;
    case 'RBN':
      gaugeControllerAddress = '0x0cb9cc35cEFa5622E8d25aF36dD56DE142eF6415';
      gaugeAddress = '';
      rewardtokenAddress = ''; //cUSDC
      break;
    default:
      gaugeControllerAddress = '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB';
      gaugeAddress = '0x1cEBdB0856dd985fAe9b8fEa2262469360B8a3a6'; // CRV/ETH
      rewardtokenAddress = '0xD533a949740bb3306d119CC777fa900bA034cd52'; //CRV
      claimAddress = '0x3D6cffCCf099Ef375cA526e69F71Fe5Fd5cea952';
      veAddress = '0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2'; // veCRV
      break;
  }
  before(async function() {
    // try to deploy contract using abi instead...
    Bribe = await ethers.getContractFactory('BribeV2');
    bribe = await Bribe.deploy(gaugeControllerAddress, veAddress, fee);
    await bribe.deployed();
  });

  beforeEach(async function() {
    [owner, newOwner] = await ethers.getSigners();
  });

  describe('Deployment', async function() {
    it('Should have the deployer as the owner', async function() {
      expect(await bribe.owner()).to.equal(owner.address);
    });
  });

  describe('Configuration', async function() {
    it('Should return the new owner after changing it', async function() {
      const setNewOwner = await bribe.transferOwnership(newOwner.address);

      // wait until the transaction is mined
      await setNewOwner.wait();

      expect(await bribe.owner()).to.equal(newOwner.address);
    });

    it('Should return the original fee after deployment', async function() {
      expect(await bribe.feePercentage()).to.equal(fee);
    });

    it('shouldn\'t change the fee when someone other than the owner tries to change it', async function() {
      let newFee = 15;

      expect(bribe.set_fee_percentage(newFee)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should return the new fee once it\'s changed', async function() {
      let newFee = 15;
      const setFeeTx = await bribe.connect(newOwner).set_fee_percentage(newFee);

      // wait until the transaction is mined
      await setFeeTx.wait();

      expect(await bribe.feePercentage()).to.equal(newFee);
    });

    it('Should fail when a fee higher than 15% is set', async function() {
      let newFee = 16;
      expect(bribe.connect(newOwner).set_fee_percentage(newFee)).to.be.revertedWith('Fee too high');
    });
  });
  describe('Rewards', async function() {
    it('Should add a reward amount for a gauge', async function() {
      // impersonate account
      let whaleAddress = '0xb3bd459e0598dde1fe84b1d0a1430be175b5d5be';
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [whaleAddress],
      });
      const whale = await ethers.provider.getSigner(whaleAddress);
      whale.address = whale._address;

      let tokenAddress = '0x39AA39c021dfbaE8faC545936693aC917d5E7563'; //cUSDC
      // approve transfer of erc20 first
      let rewardToken = await ethers.getContractAt('ERC20', tokenAddress, whale);
      let decimals = await rewardToken.decimals();
      let amount = ethers.utils.parseUnits('50', decimals);

      let approveTX = await rewardToken.approve(bribe.address, amount);
      await approveTX.wait();

      // let rewardPerTokenBefore = await bribe.reward_per_token(gaugeAddress, rewardtokenAddress);
      // console.log(rewardPerTokenBefore);
      //
      // let activePeriodBefore = await bribe.active_period(gaugeAddress, rewardtokenAddress);
      // console.log(activePeriodBefore);

      let addReward = await bribe.connect(whale).add_reward_amount(gaugeAddress, tokenAddress, amount);
      await addReward.wait();

      // let claimable = await bribe.claimable(whaleAddress, gaugeAddress, rewardtokenAddress);
      // console.log(claimable);

      // mine 605000 blocks (just over 1 week)  with 1 minute interval (in hex)
      // await hre.network.provider.send("hardhat_mine", ["0x93b48", "0x3c"]);

      // let rewardPerTokenAfter = await bribe.reward_per_token(gaugeAddress, rewardtokenAddress);
      // console.log(rewardPerTokenAfter);

      // claimable = await bribe.claimable(whaleAddress, gaugeAddress, rewardtokenAddress);
      // console.log(claimable);

      // let activePeriod = await bribe.active_period(gaugeAddress, rewardtokenAddress);
      // console.log(activePeriod);
    });
  });
  describe('Claim reward', async function() {
    it('Should claim reward', async function() {

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [claimAddress],
      });
      const claimer = await ethers.provider.getSigner(claimAddress);
      claimer.address = claimer._address;

      // // mine 605000 blocks (just over 1 week)  with 1 minute interval (in hex)
      // await hre.network.provider.send("hardhat_mine", ["0x93b48", "0x3c"]);

      let rewardPerToken = await bribe.reward_per_token(gaugeAddress, rewardtokenAddress);
      console.log(rewardPerToken);

      let claimReward = await bribe.connect(claimer).claim_reward(gaugeAddress, rewardtokenAddress);
      console.log(claimReward);


    });
    //claim_reward (2)
  });
});
