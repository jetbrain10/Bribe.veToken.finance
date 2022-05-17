import React, { useMemo } from 'react';
import { useRouter } from 'next/router';

import { Box, Button, CircularProgress, Typography } from '@material-ui/core';
import { withTheme, createTheme } from '@material-ui/core/styles';

import Layout from '../../components/layout/layout.js';
import Header from '../../components/header';
import { ApolloClient, gql, InMemoryCache, useQuery } from '@apollo/client';

import classes from './contracts.module.css';

import stores from '../../stores/index.js';
import { CONNECT_WALLET, gaugeGraphUrl } from '../../stores/constants';


const searchTheme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#2F80ED',
    },
  },
  shape: {
    borderRadius: '16px',
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
      fontSize: '12px',
    },
  },
  overrides: {
    MuiPaper: {
      elevation1: {
        'box-shadow': '0px 7px 7px #0000000A;',
        '-webkit-box-shadow': '0px 7px 7px #0000000A;',
        '-moz-box-shadow': '0px 7px 7px #0000000A;',
      },
    },
    MuiInputBase: {
      input: {
        fontSize: '14px',
      },
    },
    MuiOutlinedInput: {
      input: {
        padding: '34px 50px',
      },
      notchedOutline: {
        borderColor: 'transparent',
      },
      adornedEnd: {
        paddingRight: '40px',
      },
      adornedStart: {
        paddingLeft: '40px',
      },
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

  const { loading } = useQuery(query, { client });

  const onBackClicked = () => {
    router.push(`/`);
  };

  const contract_addresses = [
    {
      contract: 'BRIBERY ADDRESS',
      address: '0x171f3cd87e043539ef64b19121854cd1ab74894f',
    },
    {
      contract: 'BRIBERY ADDRESS V2',
      address: '0x7893bbb46613d7a4fbcc31dab4c9b823ffee1026',
    },
    {
      contract: 'GAUGE CONTROLLER ADDRESS',
      address: '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB',
    },
    {
      contract: 'BRIBERY TOKENS ADDRESS V2',
      address: '0xF40A62b2C2bbf8469174F786F103EAfC0235D8AB',
    },
    {
      contract: 'VOTE BRIBERY ADDRESS',
      address: '0xA49B8296fDB0Ee3Da0428D56FEb0d32d07607D6F',
    },
    {
      contract: 'VOTE SOURCE ADDRESS',
      address: '0xE478de485ad2fe566d49342Cbd03E49ed7DB3356',
    },
  ];

  return (
    <Layout changeTheme={changeTheme}>
      <div className={classes.container}>
        <div className={theme.palette.type === 'dark' ? classes.headContainerDark : classes.headContainer}>
          <div className={classes.headContainerContent}>
            <Header changeTheme={changeTheme} variant={2} backClicked={onBackClicked} />
            <Typography className={classes.selectPool}>Contract Addresses</Typography>
          </div>
        </div>
        <div className={classes.tableContainer}>
          <div className={theme.palette.type === 'dark' ? classes.tableHeaderDark : classes.tableHeader}>
            <div className={classes.tableHeaderRow}>
              <div className={classes.poolRow}>
                <Typography className={`${classes.tableHeaderText}`}>
                  Contract
                </Typography>
              </div>
              <div className={classes.poolRow}>
                <Typography className={`${classes.tableHeaderText}`}>
                  Address
                </Typography>
              </div>
            </div>
          </div>
          <div className={classes.tableBody}>
            {contract_addresses.map((e) => {
              return (
                <div className={classes.tableRow}>
                  <div className={classes.poolRow}>
                    <Typography>{e.contract}</Typography>
                  </div>
                  <div className={classes.poolRow}>
                    <a href={`https://etherscan.io/address/${e.address}`} target='_blank' rel='noopener noreferrer'>
                      <Typography>{e.address}</Typography>
                    </a>
                  </div>

                </div>
              );
            })
            }
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withTheme(Voting);
