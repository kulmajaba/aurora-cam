const express = require('express');
const execFile = require('child_process').execFile;
const bodyParser = require('body-parser');

const gp = execFile('gphoto2', ['--auto-detect']);
gp.stdout.on('data', (data) => {
    console.log(data);
});

let app = express();
app.use(bodyParser.json());

app.get('/', function(request, response) {
    response.send('Hello world!');
});

// Get all settings, their values and options
app.get('/api/v1/config', function(request, response) {
    // default limited buffersize is 200 kB
    const gp1 = execFile('gphoto2', ['--list-all-config'], { maxBuffer: 500*1024 }, (error, data, stderr) => {
        let lines = data.toString().split('\n');
        let result = {};
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
                // Printable, Help and buffer end end up here
                console.log(`WAT`);
            }
        }
        console.log('Great success');
        response.send(result);
    });
    console.log('Done')
});

// Change camera settings
// Currently only ISO, Aperture and Shutter speed supported
app.post('/api/v1/config/main/:category/:setting', function(request, response) {
    let cat = request.params.category;
    let set = request.params.setting;

    if (cat === 'imgsettings' && set === 'iso' ||
        cat === 'capturesettings' && (set === 'shutterspeed' || set === 'aperture')) {
            const entry = `/main/${request.params.category}/${request.params.setting}=${request.body.index}`;
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

app.listen(3000, function() {
    console.log('We\'re live on 3000!');
});