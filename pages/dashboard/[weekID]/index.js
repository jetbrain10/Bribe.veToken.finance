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


import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { gaugeGraphUrl } from '../../../utils/constants.js';
import { convertToCurrencyWithSign, convertToInternationalCurrencySystem, getGaugeSymbol, getManualGaugeName, tokenOracle } from '../../../utils/utils.js';


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

  const barColors = ["#1f77b4", "#ff7f0e", "#2ca02c"]

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
              symbol
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
                stats:{}
            }
            var stats = {}
            let veCRVTotal = 0
            for(let stat of data.week.stats){
                const balance = Number(stat.totalUserBalance)
                const rewardUSD = (Number(stat.weeklyClaimedRewards) / (10 ** Number(stat.token.decimals)))  * Number(prices[stat.token.id] ? prices[stat.token.id]['usd']:  '0')
               if(!(balance == 0 || rewardUSD == 0 )){
                if(!stats[stat.gauge.id]){
                  stats[stat.gauge.id] = {
                    rewards : 0,
                    vecrv : 0,
                    name : '',
                    symbol : '',
                  }
                }

                stats[stat.gauge.id]['rewards'] += Number(rewardUSD.toFixed(3))
                stats[stat.gauge.id]['vecrv'] += balance == 0 || rewardUSD == 0 ?0 :(rewardUSD/(balance/(10 ** 18)))
                stats[stat.gauge.id]['name'] = stat.gauge.name
                stats[stat.gauge.id]['symbol'] = stat.gauge.symbol

                if(stat.gauge.name == ''){
                  stats[stat.gauge.id]['name'] = getManualGaugeName(stat.gauge.id)
                }

                if(stat.gauge.symbol == ''){
                  stats[stat.gauge.id]['symbol'] = getGaugeSymbol(stat.gauge.id)
                }
                
                weekData.rewards += stats[stat.gauge.id]['rewards']
                veCRVTotal += stats[stat.gauge.id]['vecrv'] * stats[stat.gauge.id]['rewards']
               }
               weekData.vecrv = veCRVTotal/weekData.rewards
            }
            weekData.stats = stats
          setWeekData(weekData)
    }
   
  }, [data])


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
    const chartData = Object.entries(weekData.stats).map(([k, v])=>{
      return {symbol: v.symbol, total: Number(v.rewards.toFixed(3))}
    }).sort(function(a,b) {
      return b.total-a.total
  })
    return (
      <Box justifyContent='center' display='flex' bgcolor={theme.palette.type === 'dark' ? "#141C2F":"#fff"} padding={4} fullWidth borderRadius={10}>
    <ResponsiveContainer width="90%" height={250}>
  <BarChart
      data={chartData}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
      className={ classes.chart }
    >
     <CartesianGrid strokeDasharray="6" vertical={false}/> <XAxis dataKey="symbol"  />
      <YAxis tickFormatter={convertToCurrencyWithSign}/>
      <Tooltip cursor={false}  />
      <Bar maxBarSize={30}  dataKey="total" fill="#8884d8" > {
                        chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={barColors[index % 20]} />
                        ))
                    }</Bar>
    </BarChart>
    </ResponsiveContainer >
  </Box>
    )
  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={ classes.container }>
      <div className={ theme.palette.type === 'dark' ? classes.headContainerDark : classes.headContainer }>
          <div className={ classes.headContainerContent }>
            <Header changeTheme={ changeTheme } variant={2} backClicked={ onBackClicked }/>
          </div>
          
          <div className={ classes.searchField }>
            {dataChart()}

            <Box  sx={{ py: 1 }}></Box>
              <Paper className={ classes.searchPaper }>
              {
          weekData ?
          (
          <Box bgcolor={theme.palette.type === 'dark' ? "#141C2F":"#fff"}   borderRadius={10} borderColor="#141C2F">
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
                  <Typography align="center" className={ classes.nameText }>${weekData.vecrv.toFixed(3)}</Typography>
                  $/veCRV
            </Grid>
          </Grid>
          </Box>
          ):null
        }    
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