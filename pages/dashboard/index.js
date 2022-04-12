import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

import { Box, Button, CircularProgress, Typography } from '@material-ui/core';
import { withTheme, createTheme } from '@material-ui/core/styles';
import * as moment from 'moment';

import Layout from '../../components/layout/layout.js';
import Header from '../../components/header';
import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client";

import classes from './dashboard.module.css';

import stores from '../../stores/index.js';
import {  CONNECT_WALLET } from '../../stores/constants';
import { gaugeGraphUrl } from '../../utils/constants.js';
import { convertToInternationalCurrencySystem, tokenOracle } from '../../utils/utils.js';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

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
  
  
  const query = gql`
     {
        weeks(orderBy: id, orderDirection: desc) {
        id
        timestamp
          stats {
            token {
              id
              decimals
            }
            gauge{
              id
            }
            totalUserBalance
            weeklyClaimedRewards
          }
        }
      }
    `;
    
  const { data, loading, error, refetch } = useQuery(query, { client });
  const [weeklyData, setWeeklyData] = useState()

  const [sort, setSort] = useState(0)
  const getTokenPrices = async () =>{
    let tokens = []
    for(let week of data.weeks){
        for(let stat of week.stats){
         tokens.push(stat.token.id)
         }
     }
     const prices =await tokenOracle(tokens)
     return prices;
  }
  useEffect(async () => {
    if(data){
        const prices = await getTokenPrices();
        let newWeeklyData = []
        for(let week of data.weeks){
            const weekData = {
                id: week.id,
                timestamp: Number(week.timestamp),
                vecrv: 0,
                rewards: 0 
            }
            let veCRVTotal = 0
            var stats = {}
            for(let stat of week.stats){
                const balance = Number(stat.totalUserBalance)
                const rewardUSD = (Number(stat.weeklyClaimedRewards) / (10 ** Number(stat.token.decimals)))  * Number(prices[stat.token.id] ? prices[stat.token.id]['usd']:  '0')
                if(!stats[stat.gauge.id]){
                  stats[stat.gauge.id] = {
                    rewards : 0,
                    vecrv : 0,
                  }
                }
                stats[stat.gauge.id]['rewards'] += Number(rewardUSD.toFixed(3))
                stats[stat.gauge.id]['vecrv'] += balance == 0 || rewardUSD == 0 ?0 :(rewardUSD/(balance/(10 ** 18)))

                weekData.rewards += stats[stat.gauge.id]['rewards']
                veCRVTotal += stats[stat.gauge.id]['vecrv'] * stats[stat.gauge.id]['rewards']
            }
            weekData.vecrv = veCRVTotal/weekData.rewards
            weekData.vecrv = weekData.vecrv.toFixed(3)
            newWeeklyData.push(weekData)
        }
        setWeeklyData(newWeeklyData)
    }
  
   
  }, [data])
  const dataChart = ()=>{
    if(!weeklyData){
      return null
    }

    var chartData = JSON.parse(JSON.stringify(weeklyData))
   chartData.map(weekData =>{
    if(weekData.vecrv > 1){
      weekData.vecrv = 0
    }
      weekData.date= moment.unix(weekData.timestamp).format("DD/MM/YY")
     
    })
    chartData.reverse()

    return (
      <Box justifyContent='center' display='flex' bgcolor={theme.palette.type === 'dark' ? "#141C2F":"#fff"} padding={4} fullWidth borderRadius={10}>
    <ResponsiveContainer width="100%" height={250}>
  <ComposedChart
      data={chartData}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
      className={ classes.chart }
    >
     <CartesianGrid strokeDasharray="6" vertical={false}/> <XAxis  interval={0}  dataKey="date" verticalAnchor= "start" fontSize={14} angle={-45} textAnchor='end' height={75}/>
     <YAxis yAxisId={1}    domain={['auto', 'auto']}  orientation="right"/>
      <YAxis yAxisId={2}  tickFormatter={convertToInternationalCurrencySystem}/>
      <Tooltip cursor={false}  />
    <Bar yAxisId={2} maxBarSize={30}  dataKey="rewards" fill="#8884d8" /> 
      <Line  yAxisId={1} type="monotone" dataKey="vecrv" stroke="#E3C565"  activeDot={{ r: 1 }} strokeWidth={2} strokeDasharray="2"  />
    </ComposedChart>
    </ResponsiveContainer >
  </Box>
    )
  }

  const onChoose = (weekId) => {
    router.push(`/dashboard/${weekId}`);
  }

  const onBackClicked = () => {
    router.push(`/`);
  }

  const sortWeeklyData=(sortData)=>{
    let currentSort = sort
    switch(sortData){
      case 'start':
        if(currentSort == 1){
          currentSort = 0
          setWeeklyData(weeklyData.sort(function(a,b) {
            return a.timestamp-b.timestamp
          }))
        }else{
          currentSort= 1
          setWeeklyData(weeklyData.sort(function(a,b) {
            return b.timestamp-a.timestamp
          }))
        }
        break;
      case 'vecrv':
        
        if(currentSort == 2){
          currentSort = 3
          setWeeklyData(weeklyData.sort(function(a,b) {
            return a.vecrv-b.vecrv
          }))
        }else{
          currentSort= 2
          setWeeklyData(weeklyData.sort(function(a,b) {
            return b.vecrv-a.vecrv
          }))
        }
        break;
      case 'reward':
        
        if(currentSort == 4){
          currentSort = 5
          setWeeklyData(weeklyData.sort(function(a,b) {
            return a.rewards-b.rewards
          }))
          
        }else{
          currentSort= 4
          setWeeklyData(weeklyData.sort(function(a,b) {
            return b.rewards-a.rewards
          }))
        }
        
       
        break;
    }
    setSort(currentSort)

    return;
  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={ classes.container }>
      <div className={ theme.palette.type === 'dark' ? classes.headContainerDark : classes.headContainer }>
          <div className={ classes.headContainerContent }>
            <Header changeTheme={ changeTheme } variant={2} backClicked={ onBackClicked }/>
            <Typography className={ classes.selectPool }>Weekly Reports</Typography>
            <Typography className={ classes.choosePool }>Click to see the report in detail</Typography>
          </div>
          <div className={ classes.searchField }>
          {dataChart()}

          </div>
        </div>
        <div>
   
        </div>
        <div className={ classes.tableContainer }>
          <div className={ theme.palette.type === 'dark' ? classes.tableHeaderDark : classes.tableHeader }>
            <div className={ classes.tableHeaderRow }>
              <div className={ classes.poolRow }>
                <Button onClick={()=>sortWeeklyData("start")}><Typography className={ `${classes.tableHeaderText} ${classes.poolHeaderText}` }>Start</Typography></Button>
              </div>
              <div className={ classes.typeRow }>
              <Button onClick={()=>sortWeeklyData("vecrv")}><Typography className={ classes.tableHeaderText }>$/veCRV</Typography></Button>
                
              </div>
              <div className={ classes.typeRow }>
              <Button onClick={()=>sortWeeklyData("reward")}><Typography className={ classes.tableHeaderText }>Total</Typography></Button>
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
            { weeklyData && weeklyData.length > 0 &&
              weeklyData.map((weekData) => {
                let date = moment.unix(weekData.timestamp).format("MMMM Do YYYY")
                let vecrv = weekData.vecrv
                let rewards = convertToInternationalCurrencySystem(weekData.rewards)
                return (
                  <div className={ classes.tableRow }>
                    <div className={ classes.poolRow } onClick={ () => { onChoose(weekData.id) } }>
                      <img src={ '/Curve.png' } alt='' width='40px' height='40px' className={ classes.assetIcon } />
                      <Typography >{date}</Typography>
                    </div>
                   
                    <div className={ classes.typeRow }>
                      <Typography >${vecrv}</Typography>
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
