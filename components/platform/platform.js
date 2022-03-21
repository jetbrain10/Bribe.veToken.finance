import React, { Component } from "react";
// import stores from '../../stores';
import PlatformIterator from './platformIterator.js';
// import classes from './platform.css'

// class Platform {
//   render() {
    
//     // const platformsAvailable = {
//     //   CRV: "{ display: '', description: '', img: '' }",
//     //   EX1: "{ display: '', description: '', img: '' }",
//     //   EX2: "{ display: '', description: '', img: '' }"
//     // }
//     // const fullScreen = window.innerWidth < 576;


//   }
// }

class Platform extends Component{
  render() {
    const { platFormPicker, setPlatFormPicker, className } = this.props;
    return (
      <div style={{
        display: 'block',
        position: 'fixed',
        top: '0',
        left: '0',
        height: '100vh',
        width: '100vw',
        background: 'rgba(0,0,0,.5)',
        'z-index': '2'
      }}
        
        onClick={setPlatFormPicker}
      >
        <PlatformIterator className={className} />
      </div>
    );
  };
};


export default Platform