import React, { Component } from 'react';
import axios from 'axios';

import aperture from './aperture.svg';
import './App.css';

import LoadingView from './components/loading-view';

class App extends Component {
  constructor() {
    super();

    this.state = {
      loading: true,
      config: {},
      shutterspeed: 0,
      aperture: 0,
      iso: 0,
      img: null
    };
  }
  componentWillMount() {
    const hostname = window.location.hostname;
    axios.get(`http://${hostname}:8000/api/v1/config`)
      .then((response) => {
        let data = response.data;
        console.log(data);
        this.setState({
          loading: false,
          config: data,
          shutterspeed: data.shutterspeed.options.indexOf(data.shutterspeed.current),
          aperture: data.aperture.options.indexOf(data.aperture.current),
          iso: data.iso.options.indexOf(data.iso.current)
        });
      });
  }

  _onChange(event) {
    let name = event.target.name;
    let value = event.target.value;

    const hostname = window.location.hostname;
    axios.post(`http://${hostname}:8000/api/v1/config${this.state.config[name].path}`, {
      index: value
    })
      .then(() => {
        let newState = {};
        newState[name] = value;
        this.setState(newState);
      });
  }

  _capture() {
    const hostname = window.location.hostname;
    axios.post(`http://${hostname}:8000/api/v1/capture`)
      .then((response) => {
        this.setState({ image: response.data });
      });
  }

  render() {
    const hostname = window.location.hostname;

    let selections = <LoadingView />;
    if (!this.state.loading) {
      selections = (
        <div className="App-form">
          <p>Shutter speed</p>
          <select name="shutterspeed" value={this.state.shutterspeed} onChange={ (event) => this._onChange(event) }>
            {
              this.state.config.shutterspeed.options.map((opt, index) => {
                return <option key={index} value={index}>{opt}</option>;
              })
            }
          </select>
          <p>Aperture</p>
          <select name="aperture" value={this.state.aperture} onChange={ (event) => this._onChange(event) }>
            {
              this.state.config.aperture.options.map((opt, index) => {
                return <option key={index} value={index}>{opt}</option>;
              })
            }
          </select>
          <p>ISO</p>
          <select name="iso" value={this.state.iso} onChange={ (value) => this._onChange(value) }>
            {
              this.state.config.iso.options.map((opt, index) => {
                return <option key={index} value={index}>{opt}</option>;
              })
            }
          </select>
          <button onClick={ () => this._capture() }><img src={aperture} className="aperture" alt="Capture" /></button>
        </div>
      );
    }

    let image = this.state.image ? <img className="thm" src={`http://${hostname}:8000/${this.state.image}`} width={300} height={200} alt="preview"/> : null;

    return (
      <div className="App">
        <div className="App-header">
          <h1>Web-Cam</h1>
          <h2>DSLR remote control</h2>
        </div>
        <p className="App-text">
          Change the settings to your liking and take a picture.
        </p>
        <div className="inline">
          { selections }
          { image }
        </div>
      </div>
    );
  }
}

export default App;
