import async from 'async';
import {
  MAX_UINT256,
  WEEK,
  ERROR,
  TX_SUBMITTED,
  STORE_UPDATED,
  INCENTIVES_UPDATED,
  CONFIGURE_INCENTIVES,
  INCENTIVES_CONFIGURED,
  GET_INCENTIVES_BALANCES,
  INCENTIVES_BALANCES_RETURNED,
  BRIBERY_ADDRESS,
  BRIBERY_ADDRESS_V2,
  BRIBERY_TOKENS_ADDRESS_V2,
  GAUGE_CONTROLLER_ADDRESS,
  VOTE_BRIBERY_ADDRESS,
  VOTE_SOURCE_ADDRESS,
  CLAIM_REWARD,
  REWARD_CLAIMED,
  SEARCH_TOKEN,
  SEARCH_TOKEN_RETURNED,
  ADD_REWARD,
  ADD_REWARD_RETURNED,
  ADD_VOTE_REWARD,
  ADD_VOTE_REWARD_RETURNED,
  gaugeGraphUrl,
  MINIMUM_BRIBE
} from './constants';
import { NextRouter } from 'next/router'


import { ERC20_ABI, BRIBERY_ABI, GAUGE_CONTROLLER_ABI, GAUGE_CONTRACT_ABI, VOTE_SOURCE_ABI, VOTE_BRIBERY_ABI } from './abis';


import stores from './';
import { bnDec } from '../utils';
import BigNumber from 'bignumber.js';
import { ApolloClient, gql, InMemoryCache, useQuery } from '@apollo/client';

const fetch = require('node-fetch');

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      configured: false,
      gauges: [],
      votes: [],
      rewards: [],
      voteRewards: []
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE_INCENTIVES:
            this.configure(payload);
            break;
          case GET_INCENTIVES_BALANCES:
            this.getBalances(payload);
            break;
          case CLAIM_REWARD:
            this.claimReward(payload);
            break;
          case SEARCH_TOKEN:
            this.searchToken(payload);
            break;
          case ADD_REWARD:
            this.addReward(payload);
            break;
          case ADD_VOTE_REWARD:
            this.addVoteReward(payload);
            break;
          default: {
          }
        }
      }.bind(this),
    );
  }

  getStore = (index) => {
    return this.store[index];
  };

  setStore = (obj) => {
    this.store = { ...this.store, ...obj };
    console.log(this.store);
    return this.emitter.emit(STORE_UPDATED);
  };

  configure = async (payload) => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }

    const gauges = await this._getGauges(web3);
    this.setStore({ gauges: gauges, configured: true })

    const votes = await this._getVotes(web3);
    this.setStore({ votes: votes })

    this.dispatcher.dispatch({ type: GET_INCENTIVES_BALANCES });
    this.emitter.emit(INCENTIVES_CONFIGURED);
  };

  _getVotes = async (web3) => {
    try {
      const votesSourceContract = new web3.eth.Contract(VOTE_SOURCE_ABI, VOTE_SOURCE_ADDRESS)
      const votesBriberyContract = new web3.eth.Contract(VOTE_BRIBERY_ABI, VOTE_BRIBERY_ADDRESS)
      const nVotes = await votesSourceContract.methods.votesLength().call()

      const arr = [...Array(parseInt(nVotes)).keys()]

      const promises = arr.map(index => {
        return new Promise((resolve, reject) => {
          const voteInfo = this._getVoteInfo(web3, votesSourceContract, votesBriberyContract, index);
          resolve(voteInfo);
        });
      });

      const result = await Promise.all(promises);

      return result
    } catch (ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getVotes(${web3})`)
      console.log(ex)
      console.log("------------------------------------")
    }
  }

  _getVoteInfo = async (web3, votesSourceContract, votesBriberyContract, index) => {
    try {
      const [vote, rewardsPerVote] = await Promise.all([
        votesSourceContract.methods.getVote(index).call(),
        votesBriberyContract.methods.rewards_per_vote(index).call()
      ]);

      return {
        index,
        vote,
        rewardsPerVote,
      }
    } catch (ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in 4(${web3}, ${votesSourceContract}, ${votesBriberyContract}, ${index})`)
      console.log(ex)
      console.log("------------------------------------")
      return ex
    }
  }

  _getGauges = async (web3) => {
    try {
      const gaugeController = new web3.eth.Contract(GAUGE_CONTROLLER_ABI, GAUGE_CONTROLLER_ADDRESS)
      const nGauges = await gaugeController.methods.n_gauges().call()

      const arr = [...Array(parseInt(nGauges)).keys()]

      const promises = arr.map(index => {
        return new Promise((resolve, reject) => {
          const gaugeInfo = this._getGaugeInfo(web3, gaugeController, index);
          resolve(gaugeInfo);
        });
      });

      const result = await Promise.all(promises);
      const res = result.filter((g) => {
        return g !== null
      })

      return res
    } catch (ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getGauges(${web3})`)
      console.log(ex)
      console.log("------------------------------------")
    }
  }

  _getGaugeInfo = async (web3, gaugeController, index) => {
    try {
      const gaugeAddress = await gaugeController.methods.gauges(index).call()
      const [gaugeType, gaugeWeight] = await Promise.all([
        gaugeController.methods.gauge_types(gaugeAddress).call(),
        gaugeController.methods.gauge_relative_weight(gaugeAddress).call()
      ]);

      let name = 'Unknown'
      let lpTokenAddress = ''

      if (['0', '5', '6'].includes(gaugeType)) {
        try {
          const gauge = new web3.eth.Contract(GAUGE_CONTRACT_ABI, gaugeAddress)
          lpTokenAddress = await gauge.methods.lp_token().call()
          // if not 0, we cant get LP token info cause it is on a different chain
          const lpToken = new web3.eth.Contract(ERC20_ABI, lpTokenAddress)
          name = await lpToken.methods.name().call()
        } catch (err) {
          console.log(err);
        }
      }
      if (name === "Unknown") {
        //manually map gauge names
        switch (gaugeAddress) {
          case '0xb9C05B8EE41FDCbd9956114B3aF15834FDEDCb54':
            name = 'Curve.fi DAI/USDC (DAI+USDC)'
            break;
          case '0xfE1A3dD8b169fB5BF0D5dbFe813d956F39fF6310':
            name = 'Curve.fi fUSDT/DAI/USDC'
            break;
          case '0xC48f4653dd6a9509De44c92beb0604BEA3AEe714':
            name = 'Curve.fi amDAI/amUSDC/amUSDT'
            break;
          case '0x6955a55416a06839309018A8B0cB72c4DDC11f15':
            name = 'Curve.fi USD-BTC-ETH'
            break;
          case '0x488E6ef919C2bB9de535C634a80afb0114DA8F62':
            name = 'Curve.fi amWBTC/renBTC'
            break;
          case '0xfDb129ea4b6f557b07BcDCedE54F665b7b6Bc281':
            name = 'Curve.fi WBTC/renBTC'
            break;
          case '0x060e386eCfBacf42Aa72171Af9EFe17b3993fC4F':
            name = 'Curve USD-BTC-ETH'
            break;
          case '0x6C09F6727113543Fd061a721da512B7eFCDD0267':
            name = 'Curve.fi wxDAI/USDC/USDT'
            break;
          case '0xDeFd8FdD20e0f34115C7018CCfb655796F6B2168':
            name = 'Curve.fi USD-BTC-ETH'
            break;
          case '0xd8b712d29381748dB89c36BCa0138d7c75866ddF':
            name = 'Curve.fi Factory USD Metapool: Magic Internet Money 3Pool'
            break;
          case '0xFf17560d746F85674FE7629cE986E949602EF948':
            name = 'Arbitrum.curve.fi USDT/USDC (USDT+USDC)'
            break;
          case '0x9044E12fB1732f88ed0c93cfa5E9bB9bD2990cE5':
            name = 'Arbitrum.curve.fi USDT/wBTC/ETH (USDT + wBTC + ETH)'
            break;
          case '0x9F86c5142369B1Ffd4223E5A2F2005FC66807894':
            name = 'Arbitrum.curve.fi wBTC/renBTC (wBTC + renBTC)'
            break;
          case '0x260e4fBb13DD91e187AE992c3435D0cf97172316':
            name = 'Ftm.curve.fi fUSDT/wBTC/wETH (fUSDT + wBTC + wETH)'
            break;
          case '0xB504b6EB06760019801a91B451d3f7BD9f027fC9':
            name = 'Avax.curve.fi aDAI/aUSDC/aUSDT (aDAI + aUSDC + aUSDT)'
            break;
          case '0x75D05190f35567e79012c2F0a02330D3Ed8a1F74':
            name = 'Avax.curve.fi wBTC.e/renBTC.e (wBTC.e + renBTC.e)'
            break;
          case '0xa05E565cA0a103FcD999c7A7b8de7Bd15D5f6505':
            name = 'Avax.curve.fi DAI.e/USDC.e/USDT.e/wBTC.e/wETH (DAI.e + USDC.e + USDT.e + wBTC.e + wETH)'
            break;
          case '0xf2Cde8c47C20aCbffC598217Ad5FE6DB9E00b163':
            name = 'Harmony.curve.fi DAI/USDC/USDT (DAI + USDC + USDT)'
            break;
          case '0x56eda719d82aE45cBB87B7030D3FB485685Bea45':
            name = 'Arbitrum.curve.fi EURS/USDC/USDT (EURS + USDC + USDT)'
            break;
          case '0xAF78381216a8eCC7Ad5957f3cD12a431500E0B0D':
            name = 'Polygon.curve.fi EURt/DAI/USDC/USDT (EURt + DAI + USDC + USDT)'
            break;
          case '0xc1c5B8aAfE653592627B54B9527C7E98326e83Ff':
            name = 'Ftm.curve.fi FTM/FTML (FTM + fantom-l)'
            break;
          case '0x1c77fB5486545810679D53E325d5bCf6C6A45081':
            name = 'Ftm.curve.fi MIM/FUSDT/USDC (MIM + FUSDT + USDC)'
            break;
          case '0x9562c4D2E06aAf85efC5367Fb4544ECeB788465E':
            name = 'Curve.fi UST 3pool-f Gauge Deposit '
            break;
          case '0xbAF05d7aa4129CA14eC45cC9d4103a9aB9A9fF60':
            // not found
            name = 'Fundraising gauge'
            break;
          case '0xfbb5b8f2f9b7a4d21ff44dC724C1Fb7b531A6612':
            name = 'Avax.curve.fi AVAX/AVAXL-f Gauge deposit'
            break;
          case '0xA6ff75281eACa4cD5fEEb333e8E15558208295e5':
            name = 'Ftm.curve.fi USDL-3CRV-f Gauge Deposit'
            break;
          case '0x1AEAA1b998307217D62E9eeFb6407B10598eF3b8':
            name = 'Avax.curve.fi UST/USDC/USDt (UST + USDC + USDt)'
            break;
          case '0x18006c6A7955Bf6Db72DE34089B975f733601660':
            name = 'Curve EURS-3Crv (crvEURSUSD)'
            break;
          case '0xd0698b2E41C42bcE42B51f977F962Fd127cF82eA':
            name = 'Curve.fi 4POOL-f Gauge Deposit'
            break;
          case '0xc5ae4b5f86332e70f3205a8151ee9ed9f71e0797':
            name = 'Curve.fi sUSD3CRV-f (sUSD3CRV-f-gauge)'
            break;
          default:
        }
      }

      return {
        gaugeAddress: gaugeAddress,
        lpTokenAddress: lpTokenAddress,
        name: name,
        gaugeWeight: gaugeWeight,
        gaugeType: gaugeType,
        gaugeTypeName: this._mapGaugeTypeToName(gaugeType),
        logo: '/unknown-logo.png'
      }
    } catch (ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getGaugeInfo(${web3}, ${gaugeController}, ${index})`)
      console.log(ex)
      console.log("------------------------------------")
      return null
    }
  }

  _mapGaugeTypeToName = (gaugeType) => {
    switch (gaugeType) {
      case '0':
      case '3':
      case '5':
      case '6':
        return 'Ethereum'
      case '1':
        return 'Fantom'
      case '2':
        return 'Polygon'
      case '4':
        return 'xDAI'
      case '7':
        return 'Arbitrum'
      case '8':
        return 'Avalanche'
      case '9':
        return 'Harmony'
      case '10':
        return 'Fundraising'
      default:
        return 'Unknown'
    }
  }


  _getRewardToken = async () => {
    const client = new ApolloClient({
      uri: gaugeGraphUrl,
      cache: new InMemoryCache(),
    })
    const weekId = Math.trunc(Date.now() / (WEEK * 1000)).toString()
    const query = gql`
    query Weeks($weekID: String){
      week(id: $weekID) {
        id
        stats {
          token {
            address: id
            symbol
            decimals
          }
        }
      }
    }
   `;
    const { data } = await client.query({ query: query, variables: { weekID: weekId } });
    const tokens = data.week.stats.map(stat => stat.token).filter((value, index, self) =>
      index === self.findIndex((t) => (
        t.address === value.address
      ))
    )
    return tokens
  }
  _tokenPriceLogo = async (token) => {
    let url = 'https://api.coingecko.com/api/v3/coins/ethereum/contract/' + token

    const response = await fetch(url);
    const body = await response.json();
    const data = {
      price: body.market_data.current_price.usd,
      logo: body.image.large
    }
    return data;
  }
  _getAvailableRewards = async (gaugeId, tokenId) => {
    const client = new ApolloClient({
      uri: gaugeGraphUrl,
      cache: new InMemoryCache(),
    })
    const query = gql`
    query ClaimReward($tokenId: String, $gaugeId: String){
      stats(where: {token: $tokenId, gauge:  $gaugeId}){
        weeklyClaimedRewards
      }
      rewards( where: {rewardToken:  $tokenId, gauge:  $gaugeId}) {
        amount
      }
    }
   `;
    const { data } = await client.query({ query: query, variables: { tokenId: tokenId, gaugeId: gaugeId } });
    let claimed = 0
    let rewards = 0
    for (let i = 0; i < data.stats.length; i++) {
      claimed += Number(data.stats[i].weeklyClaimedRewards)

    }
    for (let i = 0; i < data.rewards.length; i++) {
      rewards += Number(data.rewards[i].amount)
    }
    return rewards - claimed
  }

  getBalances = async (payload) => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }

    const account = await stores.accountStore.getStore('account');
    if (!account) {
      return null;
    }

    let gauges = this.getStore('gauges')
    if (!gauges || gauges.length === 0) {
      return null
    }

    gauges = await this._getCurrentGaugeVotes(web3, account, gauges)
    let myParam = null

    if (payload.content && payload.content.address) {
      myParam = payload.content.address
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      myParam = urlParams.get('reward');
    }

    const rewardTokenAddress = myParam

    // FTM, CREAM, MIM, DAI, USDC,
    const defaultTokens = await this._getRewardToken()
    //If it is a valid token, we add it to the search list
    if (rewardTokenAddress && web3.utils.isAddress(rewardTokenAddress)) {
      let includesToken = false
      for (let i = 0; i < defaultTokens.length; i++) {
        if (defaultTokens[i].address.toLowerCase() === rewardTokenAddress.toLowerCase()) {
          includesToken = true
          break;
        }
      }

      if (!includesToken) {
        const rewardToken = await this._getTokenInfo(web3, rewardTokenAddress)
        defaultTokens.push(rewardToken)
      }
    }
    async.map(defaultTokens, async (token, callback) => {
      const bribery = await this._getBribery(web3, account, gauges, defaultTokens, token.address)
      if (callback) {
        callback(null, bribery)
      } else {
        return bribery
      }
    }, async (err, briberies) => {
      if (err) {
        this.emitter.emit(ERROR, err)
      }

      let flatBriberies = briberies.flat()
      let rewards = []
      for (let j = 0; j < flatBriberies.length; j++) {
        let bribery = flatBriberies[j]
        for (let i = 0; i < bribery.length; i++) {
          let bribe = bribery[i]
          const tokenData = await this._tokenPriceLogo(bribe.rewardToken.address)
          if((Number(bribe.availableRewards)/10 ** bribe.rewardToken.decimals) > MINIMUM_BRIBE){
            rewards.push({
              activePeriod: bribe.activePeriod,
              rewardsUnlock: BigNumber(bribe.activePeriod).plus(WEEK).toFixed(0),
              claimable: BigNumber(bribe.claimable).div(10 ** bribe.rewardToken.decimals).toFixed(bribe.rewardToken.decimals),
              canClaim: bribe.canClaim,
              hasClaimed: bribe.hasClaimed,
              gauge: bribe.gauge,
              tokensForBribe: BigNumber(bribe.tokensForBribe).div(10 ** bribe.rewardToken.decimals).toFixed(bribe.rewardToken.decimals),
              rewardPerToken: bribe.rewardPerToken,
              availableRewards: bribe.availableRewards,
              rewardToken: bribe.rewardToken,
              rewardTokenPrice: tokenData.price,
              rewardTokenLogo: tokenData.logo
            })
          }
        }
      }

      this.setStore({ rewards: rewards })
      this.emitter.emit(INCENTIVES_BALANCES_RETURNED, []);
    })

    let votes = this.getStore('votes')
    if (!votes || votes.length === 0) {
      return null
    }
    const voteRewards = await this._getVoteBribery(web3, account, votes)
    this.setStore({ voteRewards: voteRewards })
    this.emitter.emit(INCENTIVES_BALANCES_RETURNED, []);
  };

  _getTokenInfo = async (web3, tokenAddress, getBalance) => {
    try {
      const token = new web3.eth.Contract(ERC20_ABI, tokenAddress)

      const [symbol, decimals] = await Promise.all([
        token.methods.symbol().call(),
        token.methods.decimals().call()
      ]);

      let balance = 0
      if (getBalance) {
        const account = await stores.accountStore.getStore('account');
        balance = await token.methods.balanceOf(account.address).call()
      }

      return {
        address: tokenAddress,
        symbol,
        decimals: parseInt(decimals),
        balance
      }

    } catch (ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getTokenInfo(${web3}, ${tokenAddress})`)
      console.log(ex)
      console.log("------------------------------------")
      return ex
    }
  }

  _getVoteBribery = async (web3, account, votes) => {
    const voteBriberyContract = new web3.eth.Contract(VOTE_BRIBERY_ABI, VOTE_BRIBERY_ADDRESS)
    const votesSourceContract = new web3.eth.Contract(VOTE_SOURCE_ABI, VOTE_SOURCE_ADDRESS)

    const res = await Promise.all(votes.map(async (vote) => {

      if (!vote.rewardsPerVote || vote.rewardsPerVote.length === 0) {
        return null
      }

      const rewards = await Promise.all(vote.rewardsPerVote.map(async (rewardTokenAddress) => {
        const [estimateBribe, rewardAmount, voterState, hsaClaimed] = await Promise.all([
          voteBriberyContract.methods.estimate_bribe(vote.index, rewardTokenAddress, account.address).call(),
          voteBriberyContract.methods.reward_amount(vote.index, rewardTokenAddress).call(),
          votesSourceContract.methods.getVoterState(vote.index, account.address).call(),
          voteBriberyContract.methods.has_claimed(vote.index, rewardTokenAddress, account.address).call()
        ]);

        const rewardToken = await this._getTokenInfo(web3, rewardTokenAddress)

        return {
          estimateBribe: BigNumber(estimateBribe).div(10 ** rewardToken.decimals).toFixed(rewardToken.decimals),
          rewardAmount: BigNumber(rewardAmount).div(10 ** rewardToken.decimals).toFixed(rewardToken.decimals),
          voterState,
          hsaClaimed,
          vote,
          rewardToken
        }
      })
      )

      return rewards
    }))

    return res.filter((reward) => {
      return reward != null
    }).flat()
  }

  _getBribery = async (web3, account, gauges, rewardTokens, rewardTokenAddress) => {
    const block = await web3.eth.getBlockNumber();

    const bribery = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS)
    const briberyV2 = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS_V2)
    const briberyTokensContract = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_TOKENS_ADDRESS_V2)

    // For V2 call gauges_per_reward.
    // foreach of those, we get the user's reward only. no looping through dead gauges anymore.
    const [gaugesPerRewardV2] = await Promise.all([
      briberyV2.methods.gauges_per_reward(rewardTokenAddress).call()
    ]);

    let briberyResultsPromisesV2 = []
    if (gaugesPerRewardV2.length > 0) {
      briberyResultsPromisesV2 = gaugesPerRewardV2.map(async (gauge) => {

        const [activePeriod, claimable, lastUserClaim, tokensForBribe, rewardPerToken] = await Promise.all([
          briberyV2.methods.active_period(gauge, rewardTokenAddress).call(),
          briberyV2.methods.claimable(account.address, gauge, rewardTokenAddress).call(),
          briberyV2.methods.last_user_claim(account.address, gauge, rewardTokenAddress).call(),
          briberyTokensContract.methods.tokens_for_bribe(account.address, gauge, rewardTokenAddress).call(),
          briberyV2.methods.reward_per_token(gauge, rewardTokenAddress).call(),
        ]);
        const gaugeController = new web3.eth.Contract(GAUGE_CONTROLLER_ABI, GAUGE_CONTROLLER_ADDRESS)
        const period = ((Date.now() / 1000).toFixed(0) / WEEK).toFixed(0) * WEEK
        const [pointWeight] = await Promise.all([
          gaugeController.methods.points_weight(gauge, period).call()

        ]);
        const availableRewards = await this._getAvailableRewards(gauge.toString().toLowerCase(), rewardTokenAddress.toString())
        return {
          version: 2,
          claimable,
          lastUserClaim,
          activePeriod,
          tokensForBribe,
          rewardPerToken,
          availableRewards,
          canClaim: BigNumber(block).lt(BigNumber(activePeriod).plus(WEEK)),
          hasClaimed: BigNumber(lastUserClaim).eq(activePeriod),
          gauge: gauges.filter((g) => { return g.gaugeAddress.toLowerCase() === gauge.toLowerCase() })[0],
          rewardToken: rewardTokens.filter((r) => { return r.address.toLowerCase() === rewardTokenAddress.toLowerCase() })[0]
        }
      })
    }

    const briberyResultsV2 = await Promise.all(briberyResultsPromisesV2);
    return [briberyResultsV2]
  }

  _getCurrentGaugeVotes = async (web3, account, gauges) => {
    const gaugeController = new web3.eth.Contract(GAUGE_CONTROLLER_ABI, GAUGE_CONTROLLER_ADDRESS)

    const userVoteSlopes = await Promise.all(gauges.map((gauge) => {
      return gaugeController.methods.vote_user_slopes(account.address, gauge.gaugeAddress).call()
    }));

    for (let i = 0; i < gauges.length; i++) {
      gauges[i].votes = userVoteSlopes[i]
      gauges[i].votes.userVoteSlopeAmount = BigNumber(userVoteSlopes[i].slope).div(10 ** 10).toFixed(10)
      gauges[i].votes.userVoteSlopePercent = BigNumber(userVoteSlopes[i].power).div(100).toFixed(2)
    }

    return gauges
  }

  claimReward = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
    }

    const { reward } = payload.content;

    this._callClaimReward(web3, account, reward.gauge.gaugeAddress, reward.rewardToken.address, reward.version, (err, res) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(REWARD_CLAIMED, res);
    });
  }

  _callClaimReward = async (web3, account, gauge, rewardToken, version, callback) => {
    let address = BRIBERY_ADDRESS_V2
    if (version === 1) {
      address = BRIBERY_ADDRESS
    }
    const bribery = new web3.eth.Contract(BRIBERY_ABI, address);
    const gasPrice = await stores.accountStore.getGasPrice();

    this._callContractWait(web3, bribery, 'claim_reward', [gauge, rewardToken], account, gasPrice, GET_INCENTIVES_BALANCES, {}, callback);
  };

  searchToken = async (payload) => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
    }

    const { address } = payload.content;

    try {
      const token = await this._getTokenInfo(web3, address, true)
      return this.emitter.emit(SEARCH_TOKEN_RETURNED, token);
    } catch (ex) {
      console.log(ex)
      return this.emitter.emit(ERROR, ex)
    }
  }

  addReward = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
    }

    const { rewardToken, rewardAmount, gauge } = payload.content;

    let sendAmount = BigNumber(rewardAmount).times(10 ** rewardToken.decimals).toFixed(0)

    this._checkAllowance(web3, rewardToken.address, account.address, BRIBERY_ADDRESS_V2, sendAmount, (err) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }
      this._callAddReward(web3, account, gauge.gaugeAddress, rewardToken.address, sendAmount, (err, res) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(ADD_REWARD_RETURNED, res);
      });
    })
  }

  _checkAllowance = async (web3, token, owner, spender, spendingAmount, callback) => {
    const tokenContract = new web3.eth.Contract(ERC20_ABI, token)
    const allowance = await tokenContract.methods.allowance(owner, spender).call();

    if (BigNumber(spendingAmount).lte(allowance)) {
      callback()
    } else {
      const gasPrice = await stores.accountStore.getGasPrice();
      this._callContractWait(web3, tokenContract, 'approve', [spender, MAX_UINT256], { address: owner }, gasPrice, null, null, callback)
    }
  }

  _callAddReward = async (web3, account, gauge, rewardToken, rewardAmount, callback) => {
    const bribery = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS_V2);
    const gasPrice = await stores.accountStore.getGasPrice();

    this._callContractWait(web3, bribery, 'add_reward_amount', [gauge, rewardToken, rewardAmount], account, gasPrice, GET_INCENTIVES_BALANCES, {}, callback);
  };

  addVoteReward = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
    }

    const { rewardToken, rewardAmount, vote } = payload.content;

    let sendAmount = BigNumber(rewardAmount).times(10 ** rewardToken.decimals).toFixed(0)

    this._checkAllowance(web3, rewardToken.address, account.address, VOTE_BRIBERY_ADDRESS, sendAmount, (err) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }
      this._callAddVoteReward(web3, account, vote.index, rewardToken.address, sendAmount, (err, res) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(ADD_VOTE_REWARD_RETURNED, res);
      });
    })
  }

  _callAddVoteReward = async (web3, account, voteIndex, rewardToken, rewardAmount, callback) => {
    const bribery = new web3.eth.Contract(VOTE_BRIBERY_ABI, VOTE_BRIBERY_ADDRESS);
    const gasPrice = await stores.accountStore.getGasPrice();

    this._callContractWait(web3, bribery, 'add_reward_amount', [voteIndex, rewardToken, rewardAmount], account, gasPrice, GET_INCENTIVES_BALANCES, {}, callback);
  };

  _callContract = (web3, contract, method, params, account, gasPrice, dispatchEvent, dispatchEventPayload, callback) => {
    const context = this;
    contract.methods[method](...params)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
      })
      .on('transactionHash', function (hash) {
        context.emitter.emit(TX_SUBMITTED, hash);
        callback(null, hash);
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        if (dispatchEvent && confirmationNumber == 0) {
          context.dispatcher.dispatch({ type: dispatchEvent, content: dispatchEventPayload });
        }
      })
      .on('error', function (error) {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  _callContractWait = (web3, contract, method, params, account, gasPrice, dispatchEvent, dispatchEventPayload, callback) => {
    const context = this;
    contract.methods[method](...params)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
      })
      .on('transactionHash', function (hash) {
        console.log(hash)
        // context.emitter.emit(TX_SUBMITTED, hash);
      })
      .on('receipt', function (receipt) {
        context.emitter.emit(TX_SUBMITTED, receipt.transactionHash);
        callback(null, receipt.transactionHash);

        if (dispatchEvent) {
          context.dispatcher.dispatch({ type: dispatchEvent, content: dispatchEventPayload });
        }
      })
      .on('error', function (error) {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };
}

export default Store;
