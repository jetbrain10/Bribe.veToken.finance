import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, Button, FormControlLabel, Checkbox, Tooltip, Divider, ClickAwayListener, Box } from '@material-ui/core'
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import PieChartIcon from '@material-ui/icons/PieChart';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import BigNumber from 'bignumber.js';
import classes from './rewardCard.module.css'

import * as moment from 'moment';
import stores from '../../stores/index.js'
import { getProvider, formatCurrency, convertToInternationalCurrencySystem } from '../../utils'
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
    MuiButton: {
      root: {
        borderRadius: '32px',
        padding: '9px 16px'
      },
      containedPrimary: {
        backgroundColor: '#fff',
        color: '#000'
      },
    },
    MuiPaper: {
      root: {
        "box-shadow": '7px red !important;',
      },
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
  const [ voting, setVoting ] = useState(false)

  const onClaim = () => {
    if(!claiming) {
      stores.dispatcher.dispatch({ type: CLAIM_REWARD, content: { reward }})
      setClaiming(true)
    }
  }
  const [toolTipOpen, setTollTipOpen] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reward?.gauge?.gaugeAddress ?? '')
    setTollTipOpen(true);
  };
  const handleTooltipClose = () => {
    setTollTipOpen(false);
  };
  const onVote = () => {
    window.open('https://dao.curve.fi/gaugeweight')
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
  const detailsView = (reward) =>{
      return (
        <Grid  container alignContent='space-between' alignItems='center'  spacing={2}>
          <Grid item xs={6}>
             Total Reward
          </Grid>
          <Grid item xs={6} align='right'>
            {convertToInternationalCurrencySystem(((Number(reward.availableRewards))/(10 ** reward.rewardToken.decimals )).toFixed(0))} ${reward.rewardToken.symbol}
          </Grid>

          <Grid item xs={6}>
             Reward(USD)
          </Grid>
          <Grid item xs={6} align='right'>
            ${convertToInternationalCurrencySystem((( Number(reward.availableRewards))/(10 ** reward.rewardToken.decimals )).toFixed(0) * reward.rewardTokenPrice)}
          </Grid>
          <Grid item xs={6}>
             Gauge Address
          </Grid>
          <Grid item xs={6} align='right'>
          <ClickAwayListener onClickAway={handleTooltipClose}>
              <Tooltip
                PopperProps={{
                  disablePortal: true,
                }}
                onClose={handleTooltipClose}
                open={toolTipOpen}
                disableFocusListener
                disableHoverListener
                disableTouchListener
                title="Copied"
              >
                <Button color='primary' onClick={handleCopy}>
                <FileCopyIcon  fontSize='small'/>
             {reward.gauge.gaugeAddress.substring(0,5)+'...'}
                </Button>
              </Tooltip>
          </ClickAwayListener>
            
         
          
          </Grid>
        </Grid>
      )
  }
  const renderClaimable = () => {
    return (
      <>
        {detailsView(reward)}
        <Typography className={ classes.descriptionText} align='center' >{ formatCurrency(reward.claimable) } { reward.rewardToken.symbol }</Typography>
        <Typography className={ classes.descriptionSubText } align='center'>Your reward for voting for {reward.gauge.name}</Typography>
        {
          reward.hasClaimed &&
          <Button
            className={ classes.tryButton }
            variant='outlined'
            disableElevation
            color='primary'
          >
            <Typography className={ classes.buttonLabel }>Reward Claimed</Typography>
          </Button>
        }
        {
          !reward.hasClaimed &&
          <Button
            className={ classes.tryButton }
            variant='outlined'
            disableElevation
            onClick={ onClaim }
            color='primary'
            disabled={ claiming }
          >
            <Typography className={ classes.buttonLabel }>{ claiming ? 'Claiming ...' : 'Claim Reward'}</Typography>
          </Button>
        }
      </>
    )
  }

  const renderAvailable = () => {

    return (
      <>
              {detailsView(reward)}

        <Typography className={ classes.descriptionPreText } align='center'>Current receive amount:</Typography>
        <Typography className={ classes.descriptionText} align='center' >{ formatCurrency(BigNumber(reward.tokensForBribe).times(reward?.gauge?.votes?.userVoteSlopePercent ?? 0).div(100)) } { reward.rewardToken.symbol }</Typography>
        <Box m={2}>
        
        </Box>
       
        
        <Typography className={ classes.descriptionSubText } align='center'>100% vote for {reward?.gauge.name} gives you {formatCurrency(reward.tokensForBribe)} { reward.rewardToken.symbol }</Typography>
        <Typography className={ classes.descriptionUnlock } align='center'>Unlocks {moment.unix(reward.rewardsUnlock).fromNow()}</Typography>
      
        <Button
          className={ classes.tryButton }
          variant='outlined'
          disableElevation
          onClick={ onVote }
          color='primary'
          disabled={ voting }
        >
          <Typography className={ classes.buttonLabel }>{ voting ? 'Voting ...' : 'Cast Vote' }</Typography>
        </Button>
      </>
    )
  }

  const getContainerClass = () => {
    if(BigNumber(reward.claimable).gt(0)) {
      return classes.chainContainerPositive
    } else if (BigNumber(reward?.gauge?.votes?.userVoteSlopePercent ?? 0).gt(0)) {
      return classes.chainContainerPositive
    } else if (BigNumber(reward?.gauge?.votes?.userVoteSlopePercent ?? 0).eq(0)) {
      return classes.chainContainer
    }

  }
  if(!reward.gauge){
    return null
  }
  return (
    <Paper elevation={ 1 } className={ getContainerClass() } key={ reward.id } >
      <ThemeProvider theme={theme}>
        <div className={ classes.topInfo }>
          <img 
      src={reward.rewardTokenLogo}
      height={80}
      className={ classes.avatar } />
          {
            BigNumber(reward.claimable).gt(0) && renderClaimable()
          }
          {
            BigNumber(reward.claimable).eq(0) && renderAvailable()
          }
        </div>
      </ThemeProvider>
    </Paper>
  )
}
