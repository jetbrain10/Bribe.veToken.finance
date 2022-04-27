import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

import { Box, Button, CircularProgress, IconButton, Tooltip, Typography } from '@material-ui/core';
import { withTheme, createTheme } from '@material-ui/core/styles';
import * as moment from 'moment';

import Layout from '../../components/layout/layout.js';
import Header from '../../components/header';
import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client";

import classes from './rewardHistory.module.css';

import stores from '../../stores/index.js';
import { CONNECT_WALLET, gaugeGraphUrl } from '../../stores/constants';

import { addDollarSign, convertToCurrencyWithSign, convertToInternationalCurrencySystem, getGaugeSymbol, getManualGaugeName } from '../../utils/utils.js';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import HelpIcon from '@material-ui/icons/Help';
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
        rewards(orderBy:timestamp,orderDirection:desc){
          timestamp
          rewardToken{
            name
            decimals
            symbol
          }
          amount
          amountUSD
          gauge{
            id
            name
            symbol
          }
        }
      }
    `;

  const { data, loading, error, refetch } = useQuery(query, { client });
  const [rewardData, setRewardData] = useState()

  const [sort, setSort] = useState(0)

  useEffect(async () => {
    if (data) {
      
      setRewardData(data.rewards)
    }


  }, [data])
 

  const onBackClicked = () => {
    router.push(`/`);
  }

  const sortRewardData = (sortData) => {
    if(rewardData){
      let currentSort = sort
    switch (sortData) {
      case 'timestamp':
        if (currentSort == 1) {
          currentSort = 0
          setRewardData(rewardData.slice().sort(function (a, b) {
            return b.timestamp - a.timestamp
          }))
        } else {
          currentSort = 1
          setRewardData(rewardData.slice().sort(function (a, b) {
            return a.timestamp - b.timestamp
          }))
        }
        break;
     
    }

    setSort(currentSort)
    }

    return;
  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={classes.container}>
        <div className={theme.palette.type === 'dark' ? classes.headContainerDark : classes.headContainer}>
          <div className={classes.headContainerContent}>
            <Header changeTheme={changeTheme} variant={2} backClicked={onBackClicked} />
            <Typography className={classes.selectPool}>Reward History</Typography>
          </div>
          <div className={classes.searchField}>

          </div>
        </div>
        <div>

        </div>
        <div className={classes.tableContainer}>
          <div className={theme.palette.type === 'dark' ? classes.tableHeaderDark : classes.tableHeader}>
            <div className={classes.tableHeaderRow}>
              <div className={classes.poolRow}>
                <Button onClick={() => sortRewardData("timestamp")}>
                  <Typography className={`${classes.tableHeaderText} ${classes.poolHeaderText}`}>
                    Time
                  </Typography>
                  {sort == 1 ? <ArrowDropUpIcon /> : null}
                  {sort == 0 ? <ArrowDropDownIcon /> : null}
                </Button>
              </div>
              <div className={classes.typeRow}>
                <Button >
                  <Typography className={classes.tableHeaderText}>Reward Token</Typography>

                </Button>

              </div>
              <div className={classes.typeRow} >
                <Button>
                  <Typography className={classes.tableHeaderText}>Gauge</Typography>

                </Button>
              </div>
              <div className={classes.typeRow}>
                <Button>
                  <Typography className={classes.tableHeaderText}>Amount</Typography>

                </Button>
              </div>
              <div className={classes.typeRow}>
              <Tooltip title="Amount at the time of Adding Reward">
                <Button>
                  <Typography className={classes.tableHeaderText}>Amount(USD) 
                  <HelpIcon />
                </Typography>
              
                  

                </Button>
                </Tooltip>
              </div>
              
            </div>
          </div>
          <div className={classes.tableBody}>
            {
              loading
                ? <Box justifyContent='center' display='flex' sx={{ marginTop: 15 }}>
                  <CircularProgress size={50} />
                </Box>
                : (null)
            }
            {rewardData && rewardData.length > 0 &&
              rewardData.map((reward) => {
                let date = moment.unix(reward.timestamp).format('MMMM Do YYYY, h:mm:ss a')
                let rewardUSD = convertToInternationalCurrencySystem(reward.amountUSD)
                let rewardInToken = convertToInternationalCurrencySystem((Number(reward.amount)/(10 ** reward.rewardToken.decimals )).toFixed(0)) + ' $' + reward.rewardToken.symbol
                let gauge = reward.gauge.symbol
                if(gauge == ''){
                   gauge = getGaugeSymbol(reward.gauge.id)

                }
                return (
                  <div className={classes.tableRow}>
                    <div className={classes.poolRow} >
                      <img src={'/Curve.png'} alt='' width='40px' height='40px' className={classes.assetIcon} />
                      <Typography >{date}</Typography>
                    </div>

                    <div className={classes.typeRow}>
                      <Typography >${reward.rewardToken.name}</Typography>
                    </div>
                    <div className={classes.typeRow}>
                      <Typography >${gauge}</Typography>
                    </div>
                    <div className={classes.typeRow}>
                      <Typography >{rewardInToken}</Typography>
                    </div>
                    <div className={classes.typeRow}>
                      <Typography >${rewardUSD}</Typography>
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
