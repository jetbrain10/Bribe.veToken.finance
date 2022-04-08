import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

import { Box, CircularProgress, Grid, InputAdornment, Paper, TextField, Typography } from '@material-ui/core';
import { withTheme, createTheme } from '@material-ui/core/styles';
import * as moment from 'moment';

import Layout from '../../../components/layout/layout.js';
import Header from '../../../components/header';
import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client";

import classes from '../dashboard.module.css';
import SearchIcon from '@material-ui/icons/Search';

import stores from '../../../stores/index.js';
import {  CONNECT_WALLET } from '../../../stores/constants';


import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { gaugeGraphUrl } from '../../../utils/constants.js';
import { convertToInternationalCurrencySystem, tokenOracle } from '../../../utils/utils.js';


const searchTheme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#2F80ED',
    },
  },
  shape: {
    borderRadius: '16px'
  },
  typography: {
    fontFamily: [
      'Poppins',
      'Inter',
      'Arial',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    body1: {
      fontSize: '12px'
    }
  },
  overrides: {
    MuiPaper: {
      elevation1: {
        "box-shadow": '0px 7px 7px #0000000A;',
        "-webkit-box-shadow": '0px 7px 7px #0000000A;',
        "-moz-box-shadow": '0px 7px 7px #0000000A;',
      }
    },
    MuiInputBase: {
      input: {
        fontSize: '14px'
      },
    },
    MuiOutlinedInput: {
      input: {
        padding: '34px 50px'
      },
      notchedOutline: {
        borderColor: "transparent",
      },
      adornedEnd: {
        paddingRight: '40px'
      },
      adornedStart: {
        paddingLeft: '40px'
      }
    },
  },
});


function Voting({ changeTheme, theme }) {
  const router = useRouter();
  const weekID = router.query.weekID;


  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  const client = useMemo(
    () =>
      new ApolloClient({
        uri: gaugeGraphUrl,
        cache: new InMemoryCache(),
      }),
    [gaugeGraphUrl],
  );

  const [ search, setSearch ] = useState('')

const query = gql`
     query Weeks($weekID: String){
        week(id: $weekID) {
        id
        timestamp
          stats {
            token {
              id
              decimals
            }
            gauge{
              id
              name
            }
            totalUserBalance
            weeklyClaimedRewards
          }
        }
      }
    `;
  const { data, loading, error, refetch } = useQuery(query, {variables:{weekID}, client });
  const [weekData, setWeekData] = useState()
  const getTokenPrices = async () =>{
    let tokens = []
        for(let stat of data.week.stats){
         tokens.push(stat.token.id)
        }
     const prices =await tokenOracle(tokens)
     return prices;
  }
  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  useEffect(async () => {
    if(data){
        const prices =await  getTokenPrices();
            let weekData = {
                id: data.week.id,
                timestamp: Number(data.week.timestamp),
                vecrv: 0,
                rewards: 0,
                stats:{},
                rewardTokenData:{}
            }
            var stats = {}
            for(let stat of data.week.stats){
                const balance = Number(stat.totalUserBalance)
                const rewardUSD = (Number(stat.weeklyClaimedRewards) / (10 ** Number(stat.token.decimals)))  * Number(prices[stat.token.id] ? prices[stat.token.id]['usd']:  '0')
                if(!stats[stat.gauge.id]){
                  stats[stat.gauge.id] = {
                    rewards : 0,
                    vecrv : 0,
                    name : '',
                  }
                }
                
                if(!weekData.rewardTokenData[stat.token.id]){
                  weekData.rewardTokenData[stat.token.id] = {
                    name: stat.token.name,
                    value: 0
                  }  
                }
                stats[stat.gauge.id]['rewards'] += rewardUSD
                stats[stat.gauge.id]['vecrv'] += (rewardUSD/(balance/(10 ** 18)))
                stats[stat.gauge.id]['name'] = stat.gauge.name
                if(stat.gauge.name == ''){
                  stats[stat.gauge.id]['name'] = getManualGaugeName(stat.gauge.id)
                  console.log(stat.gauge.id)
                }
                
                weekData.rewardTokenData[stat.token.id].value += Number(rewardUSD.toFixed(2))
                weekData.rewards += stats[stat.gauge.id]['rewards']
                weekData.vecrv += stats[stat.gauge.id]['vecrv']
            }
            weekData.stats = stats

          setWeekData(weekData)
    }
   
  }, [data])

  const getManualGaugeName=(gaugeAddress)=>{
    let name = ''
    switch (gaugeAddress) {
      case '0xb9c05b8ee41fdcbd9956114b3af15834fdedcb54':
        name = 'Curve.fi DAI/USDC (DAI+USDC)'
        break;
      case '0xfe1a3dd8b169fb5bf0d5dbfe813d956f39ff6310':
        name = 'Curve.fi fUSDT/DAI/USDC'
        break;
      case '0xc48f4653dd6a9509de44c92beb0604bea3aee714':
        name = 'Curve.fi amDAI/amUSDC/amUSDT'
        break;
      case '0x6955a55416a06839309018a8b0cb72c4ddc11f15':
        name = 'Curve.fi USD-BTC-ETH'
        break;
      case '0x488e6ef919c2bb9de535c634a80afb0114da8f62':
        name = 'Curve.fi amWBTC/renBTC'
        break;
      case '0xfdb129ea4b6f557b07bcdcede54f665b7b6bc281':
        name = 'Curve.fi WBTC/renBTC'
        break;
      case '0x060e386ecfbacf42aa72171af9efe17b3993fc4f':
        name = 'Curve USD-BTC-ETH'
        break;
      case '0x6c09f6727113543fd061a721da512b7efcdd0267':
        name = 'Curve.fi wxDAI/USDC/USDT'
        break;
      case '0xdefd8fdd20e0f34115c7018ccfb655796f6b2168':
        name = 'Curve.fi USD-BTC-ETH'
        break;
      case '0xd8b712d29381748db89c36bca0138d7c75866ddf':
        name = 'Curve.fi Factory USD Metapool: Magic Internet Money 3Pool'
        break;
      default:
    }
    return name
  }

  const onChoose = (weekId) => {
    router.push(`/dashboard/${weekId}`);
  }

  const onBackClicked = () => {
    router.push(`/dashboard`);
  }
  const dataChart = ()=>{
    if(!weekData){
      return null
    }
    const chartData = Object.entries(weekData.rewardTokenData).map(([k, v])=>{
      console.log(v)
      return {name: v.name, value: Number(v.value)}
    })
    console.log(chartData)
    return (
      <BarChart
      width={500}
      height={300}
      data={chartData}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" fill="#8884d8" />
    </BarChart>
    )
  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={ classes.container }>
      <div className={ theme.palette.type === 'dark' ? classes.headContainerDark : classes.headContainer }>
          <div className={ classes.headContainerContent }>
            <Header changeTheme={ changeTheme } variant={2} backClicked={ onBackClicked }/>
            <Typography className={ classes.selectPool }>Detailed Report</Typography>
            <Typography className={ classes.choosePool }></Typography>
          </div>
          
          <div className={ classes.searchField }>
              <Paper className={ classes.searchPaper }>
              {
          weekData ?
          (
          <Grid container justifyContent='center' display='flex' >
            <Grid item xs='4' align="center" >
                  <Typography align="center" className={ classes.nameText }>{moment.unix(weekData.timestamp).format("MMMM Do YYYY")}</Typography>
                  Start
            </Grid>
            <Grid item xs='4' align="center">
                  <Typography align="center" className={ classes.nameText }>${convertToInternationalCurrencySystem(weekData.rewards)}</Typography>
                  Total
            </Grid>
            <Grid item xs='4' align="center">
                  <Typography align="center" className={ classes.nameText }>${weekData.vecrv.toFixed(2)}</Typography>
                  $/veCRV
            </Grid>
          </Grid>
          ):null
        }
                <TextField
                  fullWidth
                  className={ classes.searchContainer }
                  variant="outlined"
                  placeholder="3Pool, IronBank"
                  value={ search }
                  onChange={ onSearchChanged }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      <SearchIcon fontSize="medium"  />
                    </InputAdornment>,
                    startAdornment: <InputAdornment position="start">
                      <Typography className={ classes.searchInputAdnornment }>
                        Search Pools:
                      </Typography>
                    </InputAdornment>
                  }}
                /> 
              </Paper>
          </div>
     
        </div>
        
        
        <div className={ classes.tableContainer }>
          
          <div className={ theme.palette.type === 'dark' ? classes.tableHeaderDark : classes.tableHeader }>
            
            <div className={ classes.tableHeaderRow }>
              <div className={ classes.poolRow }>
                <Typography className={ `${classes.tableHeaderText} ${classes.poolHeaderText}` }>Name</Typography>
              </div>
              <div className={ classes.typeRow }>
                <Typography className={ classes.tableHeaderText }>$/veCRV</Typography>
              </div>
              <div className={ classes.typeRow } >
                <Typography className={ classes.tableHeaderText }>Total</Typography>
              </div>
          
            </div>
          </div>
          <div className={ classes.tableBody }>
            
            { 
              loading 
              ? <Box justifyContent='center' display='flex' sx={{ marginTop: 15 }}>
                <CircularProgress size={50} />
                </Box>
              :(null)
            }
            { weekData &&
              Object.entries(weekData.stats)
              .filter(([k,statData]) => {
                if(search) {
                  return statData.name.toLowerCase().includes(search.toLowerCase()) ||
                    k.toLowerCase().includes(search.toLowerCase())
                }

                return true
              })
              .map(([k,statData]) => {
                let name = statData.name
                let vecrv = statData.vecrv.toPrecision(2)
                let rewards = convertToInternationalCurrencySystem(statData.rewards)
                return (
                  <div className={ classes.tableRow }>
                    <div className={ classes.poolRow } >
                    <img src={ '../unknown-logo.png' } alt='' width='40px' height='40px' className={ classes.assetIcon } />
                      <Typography className={ classes.nameText }>{name}</Typography>
                    </div>
                   
                    <div className={ classes.typeRow }>
               
                      <Typography >${ vecrv }</Typography>
                    </div>
                    <div className={ classes.typeRow }>
                      <Typography >${rewards}</Typography>
                    </div>
                    
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withTheme(Voting);
