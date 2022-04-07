import React, { useState, useEffect } from 'react';

import { Typography, Switch, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { withTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import IconButton from '@material-ui/core/IconButton';

import WbSunnyOutlinedIcon from '@material-ui/icons/WbSunnyOutlined';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import { CONNECT_WALLET, CONFIGURE_RETURNED } from '../../stores/constants';

import Unlock from '../unlock';
import Platform from '../platform';

import stores from '../../stores';
import { formatAddress } from '../../utils';

import classes from './header.module.css';

const StyledSwitch = withStyles((theme) => ({
  root: {
    width: 58,
    height: 32,
    padding: 0,
    margin: theme.spacing(1),
  },
  switchBase: {
    padding: 1,
    '&$checked': {
      transform: 'translateX(28px)',
      color: '#212529',
      '& + $track': {
        backgroundColor: '#ffffff',
        opacity: 1,
      },
    },
    '&$focusVisible $thumb': {
      color: '#ffffff',
      border: '6px solid #fff',
    }
  },
  thumb: {
    width: 24,
    height: 24,
  },
  track: {
    borderRadius: 32 / 2,
    border: `1px solid #212529`,
    backgroundColor: '#212529',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  checked: {},
  focusVisible: {},
}))(({ classes, ...props }) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});

function Header(props) {
  const accountStore = stores.accountStore.getStore('account');
  const platform = stores.accountStore.getStore('platform');
  const img = stores.accountStore.getStore('platformsAvailable')[platform].img
  const [account, setAccount] = useState(null);
  const [darkMode, setDarkMode] = useState(props.theme.palette.type === 'dark' ? true : false);
  const [platFormPicker, setPlatFormPicker] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account');
      setAccount(accountStore);
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };

    const accountStore = stores.accountStore.getStore('account');
    setAccount(accountStore);

    stores.emitter.on(CONFIGURE_RETURNED, accountConfigure);
    stores.emitter.on(CONNECT_WALLET, connectWallet);
    return () => {
      stores.emitter.removeListener(CONFIGURE_RETURNED, accountConfigure);
      stores.emitter.removeListener(CONNECT_WALLET, connectWallet);
    };
  }, []);

  const handleToggleChange = (event, val) => {
    setDarkMode(val);
    props.changeTheme(val);
  };

  const onPlatformClicked = () => {
    setPlatFormPicker(!platFormPicker)
  }

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  useEffect(function () {
    const localStorageDarkMode = window.localStorage.getItem('yearn.finance-dark-mode');
    setDarkMode(localStorageDarkMode ? localStorageDarkMode === 'dark' : false);
  }, []);


  if (props.variant === 2) {
    return (
      <div className={classes.headerContainer2}>
        <Button
          className={classes.backButton}
          variant='outlined'
          onClick={props.backClicked}>
          <Typography className={classes.buttonText}>Back</Typography>
        </Button>
        <div className={classes.space}>

        </div>

        <Button disableElevation className={classes.platformButton2} variant="contained" color="secondary" onClick={onPlatformClicked}>
        <img src={img} className={ classes.protocolLogo}/><Typography variant="h5">{platform}</Typography>
      </Button>
      {/*{platFormPicker && <Platform platFormPicker={platFormPicker} setPlatFormPicker={onPlatformClicked} className={darkMode ? 'dark':'light'} />}*/}

        <Button disableElevation className={classes.accountButton2} variant='outlined' onClick={onAddressClicked}>
          {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
          <Typography className={classes.buttonText}>{account && account.address ? formatAddress(account.address) : 'Connect Wallet'}</Typography>
        </Button>
        {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
      </div>
    )
  }

  return (
    <div className={classes.headerContainer}>
      <div className={classes.themeSelectContainer}>
        <StyledSwitch
          icon={<Brightness2Icon className={classes.switchIcon} />}
          checkedIcon={<WbSunnyOutlinedIcon className={classes.switchIcon} />}
          checked={darkMode}
          onChange={handleToggleChange}
        />
      </div>
      <Button disableElevation className={classes.platformButton} variant="contained" color="secondary" onClick={onPlatformClicked}>
        <img src={img} className={ classes.protocolLogo}/><Typography variant="h5">{platform}</Typography>
      </Button>
      {platFormPicker && <Platform platFormPicker={platFormPicker} setPlatFormPicker={onPlatformClicked} className={darkMode ? 'dark':'light'} />}

      <Button disableElevation className={classes.accountButton} variant="contained" color="secondary" onClick={onAddressClicked}>
        {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
        <Typography variant="h5">{account && account.address ? formatAddress(account.address) : 'Connect Wallet'}</Typography>
      </Button>
      {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
    </div>
  );
}

export default withTheme(Header);
