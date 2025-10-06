const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TIMERS_FILE = path.join(__dirname, 'timers.json');
const MIN_RESPAWN_HOURS = 9;
const MAX_RESPAWN_HOURS = 11;

function loadTimers() {
    try {
        const data = fs.readFileSync(TIMERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function saveTimers(timers) {
    fs.writeFileSync(TIMERS_FILE, JSON.stringify(timers, null, 2));
}

app.get('/api/timers', (req, res) => {
    res.json(loadTimers());
});

app.post('/api/bosses/:boss/kill', (req, res) => {
    const bossName = decodeURIComponent(req.params.boss);
    const timers = loadTimers();
    const killTime = Date.now();
    timers[bossName] = {
        killTime: killTime,
        minRespawn: killTime + (MIN_RESPAWN_HOURS * 60 * 60 * 1000),
        maxRespawn: killTime + (MAX_RESPAWN_HOURS * 60 * 60 * 1000)
    };
    saveTimers(timers);
    res.json({ success: true, minRespawn: timers[bossName].minRespawn, maxRespawn: timers[bossName].maxRespawn });
});

app.post('/api/bosses/:boss/reset', (req, res) => {
    const bossName = decodeURIComponent(req.params.boss);
    const timers = loadTimers();
    delete timers[bossName];
    saveTimers(timers);
    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});