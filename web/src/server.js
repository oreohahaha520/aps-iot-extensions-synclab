// server.js
const express = require('express');
const path = require('path'); // 引入 path 模組以處理路徑

const { getPublicToken } = require('./services/aps.js');
const { getSensors, getChannels, getSamples } = require('./services/iot.mocked.js');
const { PORT } = require('./config.js');

// 絕對路徑到 public 資料夾 express.static 需要絕對路徑
// let app = express();
// app.use(express.static('public'));

const app = express();
// resolve 方法會將相對路徑轉換為絕對路徑
app.use(express.static(path.resolve(__dirname, 'public'))); // 使用絕對路徑

// Auth token for APS
app.get('/auth/token', async function (req, res, next) {
    try {
        res.json(await getPublicToken());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/sensors', async function (req, res, next) {
    try {
        res.json(await getSensors());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/channels', async function (req, res, next) {
    try {
        res.json(await getChannels());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/samples', async function (req, res, next) {
    try {
        res.json(await getSamples({ start: new Date(req.query.start), end: new Date(req.query.end) }, req.query.resolution));
    } catch (err) {
        next(err);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(err.message);
});

// app.listen(PORT, function () { console.log(`Server listening on port ${PORT}...`); });
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT} (bound on 0.0.0.0)`);
});
