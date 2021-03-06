import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { Typography, Paper, Button, CircularProgress, TextField, InputAdornment, IconButton, Tooltip } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { withTheme, createTheme, ThemeProvider } from '@material-ui/core/styles';

import Layout from '../../components/layout/layout.js';
import Header from '../../components/header';
import SearchIcon from '@material-ui/icons/Search';
import CopyIcon from '@material-ui/icons/FileCopyOutlined';

import classes from './add.module.css';

import stores from '../../stores/index.js';
import { ERROR, ACCOUNT_CHANGED, CONNECT_WALLET, INCENTIVES_CONFIGURED } from '../../stores/constants';

import { formatCurrency, formatAddress } from '../../utils';


const searchTheme = createTheme({
  // palette: {
  //   type: 'light',
  //   primary: {
  //     main: '#2F80ED',
  //   },
  // },
  // shape: {
  //   borderRadius: '16px'
  // },
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
  
});

function Voting({ changeTheme, theme }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [ search, setSearch ] = useState('')
  const [ gauges, setGauges ] = useState([])

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  useEffect(function () {
    const accountChanged = () => {
      setAccount(stores.accountStore.getStore('account'))
    }

    const configureReturned = () => {
      setGauges(stores.incentivesStore.getStore('gauges'))
    }

    setAccount(stores.accountStore.getStore('account'))
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(INCENTIVES_CONFIGURED, configureReturned)

    setGauges(stores.incentivesStore.getStore('gauges'))

    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(INCENTIVES_CONFIGURED, configureReturned)
    };
  }, []);

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  const onChoose = (pool) => {
    router.push(`/add/${pool.gaugeAddress}`);
  }

  const onBackClicked = () => {
    router.push(`/`);
  }

  const onTooltipClicked = (gaugeAddress) => {
    navigator.clipboard.writeText(gaugeAddress).then(res=>{
      console.log("Address copied to clipboard!");
    })
  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={ classes.container }>
        <div className={ theme.palette.type === 'dark' ? classes.headContainerDark : classes.headContainer }>
          <div className={ classes.headContainerContent }>
            <Header changeTheme={ changeTheme } variant={2} backClicked={ onBackClicked }/>
            <Typography className={ classes.selectPool }>Select a Pool</Typography>
            <Typography className={ classes.choosePool }>Choose a pool that you would like to offer rewards for below...</Typography>
          </div>
          <div className={ classes.searchField }>
            {/* <ThemeProvider theme={searchTheme}> */}
              <Paper className={ classes.searchPaper }>
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
            {/* </ThemeProvider> */}
          </div>
        </div>
        <div className={ classes.tableContainer }>
          <div className={ theme.palette.type === 'dark' ? classes.tableHeaderDark : classes.tableHeader }>
            <div className={ classes.tableHeaderRow }>
              <div className={ classes.poolRow }>
                <Typography className={ `${classes.tableHeaderText} ${classes.poolHeaderText}` }>Pool</Typography>
              </div>
              <div className={ classes.typeRow }>
                <Typography className={ classes.tableHeaderText }>Chain</Typography>
              </div>
              <div className={ classes.actionRow }>
                <Typography className={ classes.tableHeaderText }>Action</Typography>
              </div>
            </div>
          </div>
          <div className={ classes.tableBody }>
            { gauges && gauges.length > 0 &&
              gauges.filter((gauge) => {
                if(search) {
                  return gauge.name.toLowerCase().includes(search.toLowerCase()) ||
                    gauge.gaugeAddress.toLowerCase().includes(search.toLowerCase()) ||
                    gauge.lpTokenAddress.toLowerCase().includes(search.toLowerCase())
                }

                return true
              }).map((gauge) => {
                let chainClass;

                switch(gauge.gaugeTypeName){
                  case 'Fantom':
                    chainClass = classes.typeTextFantom
                    break;
                  case 'Polygon':
                    chainClass = classes.typeTextPolygon
                    break;
                  case 'xDAI':
                    chainClass = classes.typeTextXDAI
                    break;
                  case 'Arbitrum':
                    chainClass = classes.typeTextArbitrum
                    break;
                  case 'Avalanche':
                    chainClass = classes.typeTextAvalanche
                    break;
                  case 'Harmony':
                    chainClass = classes.typeTextHarmony
                    break;
                  case 'Fundraising':
                    chainClass = classes.typeTextFundraising
                    break;
                  default:
                    chainClass = classes.typeText
                    break;
                }


                return (
                  <div className={ classes.tableRow }>
                    <div className={ classes.poolRow }>
                      <img src={ gauge.logo } alt='' width='40px' height='40px' className={ classes.assetIcon } />
                      <Typography className={ classes.nameText }>{gauge.name}</Typography>
                      <Tooltip title="Copy address to clipboard">
                        <IconButton style={{color: '#b1b6c1'}} onClick={ () => { onTooltipClicked(gauge.gaugeAddress) }}>
                          <CopyIcon style={{fontSize: 18}} />
                        </IconButton>
                      </Tooltip>
                    </div>
                    <div className={ classes.typeRow }>
                      <Typography className={ chainClass }>{gauge.gaugeTypeName}</Typography>
                    </div>
                    <div className={ classes.actionRow }>
                      <Button
                        variant='outlined'
                        size='small'
                        color='primary'
                        onClick={ () => { onChoose(gauge) } }
                        className={ classes.chooseButton }
                        >
                        <Typography className={ classes.buttonText }>Choose Pool</Typography>
                      </Button>
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
