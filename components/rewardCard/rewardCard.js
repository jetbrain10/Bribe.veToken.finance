import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, Button, FormControlLabel, Checkbox } from '@material-ui/core'
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import RedeemIcon from '@material-ui/icons/Redeem';
import BigNumber from 'bignumber.js';

import classes from './rewardCard.module.css'

import stores from '../../stores/index.js'
import { getProvider, formatCurrency } from '../../utils'

import { CLAIM_REWARD, ERROR, REWARD_CLAIMED } from '../../stores/constants';

const theme = createTheme({
  palette: {
    type: 'dark',
    secondary: {
      main: '#fff'
    }
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
    MuiButton: {
      root: {
        borderRadius: '32px',
        padding: '9px 16px'
      },
      containedPrimary: {
        backgroundColor: '#fff',
        color: '#000'
      }
    },
    MuiFormControlLabel: {
      root: {
        color: '#fff'
      }
    }
  },
});


export default function RewardCard({ reward }) {

  const [ checked, setChecked ] = useState(false)
  const [ claiming, setClaiming ] = useState(false)

  const onClaim = () => {
    if(!claiming) {
      stores.dispatcher.dispatch({ type: CLAIM_REWARD, content: { reward }})
      setClaiming(true)
    }
  }

  useEffect(function () {
    const errorReturned = () => {
      setClaiming(false)
    }

    const claimReturned = () => {
      setClaiming(false)
    }

    stores.emitter.on(ERROR, errorReturned);
    stores.emitter.on(REWARD_CLAIMED, claimReturned)

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned);
      stores.emitter.removeListener(REWARD_CLAIMED, claimReturned)
    };
  }, []);

  return (
    <Paper elevation={ 1 } className={ classes.chainContainer } key={ reward.id } >
      <ThemeProvider theme={theme}>
        <div className={ classes.topInfo }>
          <RedeemIcon className={ classes.avatar } />
          <Typography className={ classes.descriptionText} align='center' >{ formatCurrency(BigNumber(reward.claimable).div(reward.rewardToken.decimals).toFixed(reward.rewardToken.decimals)) } { reward.rewardToken.symbol }</Typography>
          <Typography className={ classes.descriptionSubText } align='center'>Your reward for voting for reward.name on Curve.fi</Typography>
          <Button
            className={ classes.tryButton }
            variant='outlined'
            disableElevation
            onClick={ onClaim }
            color='primary'
          >
            <Typography className={ classes.buttonLabel }>{ claiming ? 'Claiming ...' : 'Claim Reward'}</Typography>
          </Button>
        </div>
      </ThemeProvider>
    </Paper>
  )
}
