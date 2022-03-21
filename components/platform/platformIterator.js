import React, { Component } from "react";
import stores from '.. //../../stores';
import classes from './platform.module.css';


class PlatformIterator extends Component {
  render() {
    const { className } = this.props;
    const platformsAvailable = stores.accountStore.getStore('platformsAvailable')//{
    //   CRV: { display: '', description: '', img: '' },
    //   EX1: { display: '', description: '', img: '' },
    //   EX2: { display: '', description: '', img: '' }
    // }
    // const fullScreen = window.innerWidth < 576;

    function setPlatformProtocolChoice(event, name) {
event.stopPropagation();
console.log(name)
  stores.accountStore.setStore({ platform: name });
      
    }

    return (
      <div
        className={classes.platformHolder + ' ' + classes[className]}
      >
        <h2 className={classes.h2}>Change DAO Protocol</h2>
        <div className={classes.flexContainer}>
          {Object.keys(platformsAvailable).map((name) => {
            const display = platformsAvailable[name].display;
            const description = platformsAvailable[name].description;
            const img = platformsAvailable[name].img;
            const disabled = platformsAvailable[name].disabled ? true : false;
            return (
              <div
                key={name}
                className={(disabled ? classes.enabled : classes.disabled) + ' ' + classes.platformChoice + ' ' + classes[className]}
                onClick={() => {setPlatformProtocolChoice(event, name)}}>
                <img src={img} className={classes.img + ' ' + classes[className]} />
                <h3 className={classes.h3}>
                  {display}</h3>
                <p className={classes.p}>{description}</p>
              </div>
            )
          })}
        </div>
      </div>
    );
  }
}

export default PlatformIterator;
