const express = require('express');
const execFile = require('child_process').execFile;
const bodyParser = require('body-parser');

function getConfig() {
  // default buffer size is 200 kB
  let result = {}
  const gp1 = execFile('gphoto2', ['--list-all-config'], { maxBuffer: 500*1024 }, (error, data, stderr) => {
    let lines = data.toString().split('\n');
    let currAttr;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      console.log(line);

      // Line is path to setting
      if (line.charAt(0) === '/') {
        let attr = line.split('/').pop();
        console.log(`New: ${attr}`);
        result[attr] = { name: attr, path: line, };
        currAttr = attr;
      }
      else if (line.substr(0, 6) === 'Label:') {
        result[currAttr].label = line.substr(7);
      }
      else if (line.substr(0, 5) === 'Type:') {
        let type = line.substr(6);
        result[currAttr].type = type;
        if (type === 'RADIO') {
          result[currAttr].options = [];
        }
      }
      else if (line.substr(0, 8) === 'Current:') {
        result[currAttr].current = line.substr(9);
      }
      else if (line.substr(0, 7) === 'Choice:') {
        let parts = line.split(' ');
        result[currAttr].options.push(parts.pop());
      }
      else {
        // Printable, Help and the end of stdout end up here, that's fine
        console.log(`WAT`);
      }
    }
    console.log('Great success');
    return result;
  });
  return result;
}

const gp = execFile('gphoto2', ['--auto-detect'], (error, data) => {
  console.log(data);
});

const app = express();
app.use(bodyParser.json());
app.locals.fullConfig = getConfig();
app.locals.host = 'http://localhost';

app.use(function (req, res, next) {
  res.append('Access-Control-Allow-Origin', `${req.app.locals.host}:3000`);
  res.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
})

// Get all settings, their values and options
// Current values can be outdated
app.get('/api/v1/config', function(request, response) {
  response.send(request.app.locals.fullConfig);
  console.log('Done');
});

// Get a setting
app.get('/api/v1/config/main/:category/:setting', function(request, response) {
  let cat = request.params.category;
  let set = request.params.setting;

  if (request.app.locals.fullConfig[set] &&
    request.app.locals.fullConfig[set].path === `/main/${cat}/${set}`) {
      const gp1 = execFile('gphoto2', ['--get-config', `/main/${cat}/${set}`], (error, data) => {
        let result = {};
        let lines = data.toString().split('\n');
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];

          if (line.substr(0, 6) === 'Label:') {
            result.label = line.substr(7);
          }
          else if (line.substr(0, 5) === 'Type:') {
            let type = line.substr(6);
            result.type = type;
            if (type === 'RADIO') {
              result.options = [];
            }
          }
          else if (line.substr(0, 8) === 'Current:') {
            result.current = line.substr(9);
          }
          else if (line.substr(0, 7) === 'Choice:') {
            let parts = line.split(' ');
            result.options.push(parts.pop());
          }
          else {
            // Printable, Help and the end of stdout end up here, that's fine
            console.log(`WAT`);
          }
        }
        response.send(result);
      });
    }
  else {
    response.status(404).send('No setting found');
  }
});

// Change camera settings
// Currently only ISO, Aperture and Shutter speed supported
app.post('/api/v1/config/main/:category/:setting', function(request, response) {
  let cat = request.params.category;
  let set = request.params.setting;

  if (cat === 'imgsettings' && set === 'iso' ||
    cat === 'capturesettings' && (set === 'shutterspeed' || set === 'aperture')) {
      const entry = `/main/${cat}/${set}=${request.body.index}`;
      const gp1 = execFile('gphoto2', ['--set-config-index', entry], () => {
        response.send('Modified');
      });
    }
  else {
    response.status(405).send('POST request to path not supported');
  }
});

// Take a picture
app.post('/api/v1/capture', function(request, response) {
  const gp1 = execFile('gphoto2', ['--capture-image-and-download'], (error, data) => {
    console.log(data);
    response.status(201).send('Success');
  });
});

app.listen(8000, function() {
  console.log('We\'re live on 8000!');
});