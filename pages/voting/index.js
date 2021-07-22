import React, { useState, useEffect } from 'react';

import { Typography, Paper, Button, CircularProgress, TextField, InputAdornment } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { withTheme, createTheme, ThemeProvider } from '@material-ui/core/styles';

import Layout from '../../components/layout/layout.js';
import Header from '../../components/header';
import Footer from '../../components/footer';
import RewardCard from '../../components/rewardCard';


import SearchIcon from '@material-ui/icons/Search';
import AppsIcon from '@material-ui/icons/Apps';
import ListIcon from '@material-ui/icons/List';
import AddIcon from '@material-ui/icons/Add';

import classes from './voting.module.css';

import stores from '../../stores/index.js';
import { ERROR, ACCOUNT_CHANGED, CONNECT_WALLET, INCENTIVES_BALANCES_RETURNED } from '../../stores/constants';

import { formatCurrency, formatAddress } from '../../utils';


const searchTheme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#2F80ED',
    },
  },
  shape: {
    borderRadius: '10px'
  },
  typography: {
    fontFamily: [
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
        padding: '12.5px 14px'
      },
      notchedOutline: {
        borderColor: "#FFF",
      }
    },
  },
});

function Voting({ changeTheme, theme }) {

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [ search, setSearch ] = useState('')
  const [ rewards, setRewards ] = useState([])

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  useEffect(function () {
    const accountChanged = () => {
      setAccount(stores.accountStore.getStore('account'))
    }

    const balanceReturned = () => {
      setRewards(stores.incentivesStore.getStore('rewards'))
    }

    setAccount(stores.accountStore.getStore('account'))
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);

    setRewards(stores.incentivesStore.getStore('rewards'))

    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(INCENTIVES_BALANCES_RETURNED, balanceReturned)
    };
  }, []);

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  const onAddReward = () => {

  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={ theme.palette.type === 'dark' ? classes.containerDark : classes.container }>
        <div className={ classes.copyContainer }>
          <div className={ classes.copyCentered }>
            <Typography variant='h1' className={ classes.titleSpacing }><span className={ classes.helpingUnderline }>Gauge Vote Incetives</span></Typography>
            <Typography variant='h2' className={ classes.helpingParagraph }>Providing incentives for users to vote for your gauge</Typography>
            <Typography className={classes.subTitle}>Gauge votes are precious. Sometimes, users need a little extra encouragement to vote for your favourite gauge. GVI incentivises users who vote a particular way.</Typography>
            {
              !account &&
                <Button
                size='large'
                color='primary'
                variant='contained'
                className={ classes.addNetworkButton }
                onClick={ onConnectWallet }
              >
                <Typography className={ classes.buttonLabel }>Connect Wallet</Typography>
              </Button>
            }
            {
              account &&
                <Button
                size='large'
                color='primary'
                variant='contained'
                className={ classes.addNetworkButton }
                endIcon={<AddIcon />}
                onClick={ onAddReward }
              >
                <Typography className={ classes.buttonLabel }>Add Rewards</Typography>
              </Button>
            }
          </div>
          <div className={ classes.socials }>
            <a className={ `${classes.socialButton}` } href='https://github.com/antonnell/gauge-vote-incentives.git' target='_blank' rel="noopener noreferrer" >
              <svg version="1.1" width="24" height="24" viewBox="0 0 24 24">
                <path fill={ '#2F80ED' } d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              <Typography variant='body1' className={ classes.sourceCode }>View Source Code</Typography>
            </a>
            <Typography variant='subtitle1' className={ classes.version }>Version 1.0.0</Typography>
          </div>
        </div>
        <div className={ theme.palette.type === 'dark' ? classes.listContainerDark : classes.listContainer }>
          <div className={ theme.palette.type === 'dark' ? classes.headerContainerDark : classes.headerContainer }>
            <div className={ classes.filterRow }>
              <ThemeProvider theme={searchTheme}>
                <Paper className={ classes.searchPaper }>
                  <TextField
                    fullWidth
                    className={ classes.searchContainer }
                    variant="outlined"
                    placeholder="Reward Token Address (eg. 0x6b1754....1d0f)"
                    value={ search }
                    onChange={ onSearchChanged }
                    InputProps={{
                      endAdornment: <InputAdornment position="end">
                        <SearchIcon fontSize="small"  />
                      </InputAdornment>,
                      startAdornment: <InputAdornment position="start">
                        <Typography className={ classes.searchInputAdnornment }>
                          Search Rewards
                        </Typography>
                      </InputAdornment>
                    }}
                  />
                </Paper>
              </ThemeProvider>
            </div>
            <Header changeTheme={ changeTheme } />
          </div>
          <div className={ classes.cardsContainer }>
            {
              rewards.filter((reward) => {
                if(search === '') {
                  return true
                } else {
                  //filter
                  return (reward.chain.toLowerCase().includes(search.toLowerCase()) ||
                  reward.chainId.toString().toLowerCase().includes(search.toLowerCase()) ||
                  reward.name.toLowerCase().includes(search.toLowerCase()) ||
                  (reward.nativeCurrency ? reward.nativeCurrency.symbol : '').toLowerCase().includes(search.toLowerCase()))
                }
              }).map((reward, idx) => {
                return <RewardCard reward={ reward } key={ idx } />
              })
            }
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withTheme(Voting);
