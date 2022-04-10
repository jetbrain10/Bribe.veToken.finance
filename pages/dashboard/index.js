import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

import { Box, CircularProgress, Typography } from '@material-ui/core';
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
            totalUserBalance
            weeklyClaimedRewards
          }
        }
      }
    `;
    
  const { data, loading, error, refetch } = useQuery(query, { client });
  const [weeklyData, setWeeklyData] = useState()
  const getTokenPrices = async () =>{
    let tokens = []
    for(let week of data.weeks){
        console.log(week);
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
            for(let stat of week.stats){
                const balance = Number(stat.totalUserBalance)
                const rewardUSD = (Number(stat.weeklyClaimedRewards) / (10 ** Number(stat.token.decimals)))  * Number(prices[stat.token.id] ? prices[stat.token.id]['usd']:  '0')
                weekData.rewards += rewardUSD
                weekData.vecrv += (rewardUSD/(balance/(10 ** 18)))
            }
            weekData.vecrv = weekData.vecrv.toFixed(2)
            newWeeklyData.push(weekData)
        }
        setWeeklyData(newWeeklyData)
    }
  
   
  }, [data])
  const dataChart = ()=>{
    if(!weeklyData){
      return null
    }
    const chartData = weeklyData
   chartData.map(weekData =>{
      weekData.date= moment.unix(weekData.timestamp).format("DD/MM/YY")
    })
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
     <YAxis yAxisId={1}   orientation="right"/>
      <YAxis yAxisId={2} tickFormatter={convertToInternationalCurrencySystem}/>
      <Tooltip cursor={false}  />
      <Line yAxisId={1} type="monotone" dataKey="vecrv" stroke="#8884d8" />
      <Bar yAxisId={2} maxBarSize={30}  dataKey="rewards" fill="#8884d8" />
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
                <Typography className={ `${classes.tableHeaderText} ${classes.poolHeaderText}` }>Start</Typography>
              </div>
              <div className={ classes.typeRow }>
                <Typography className={ classes.tableHeaderText }>$/veCRV</Typography>
              </div>
              <div className={ classes.typeRow }>
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
