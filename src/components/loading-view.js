import React, { Component } from 'react';

import logo from './../logo.svg';
import './../App.css';

export default class LoadingView extends Component {
  render() {
    return (
        <img src={logo} className="App-logo" alt="logo" />
    );
  }
}
