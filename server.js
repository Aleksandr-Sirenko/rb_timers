const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000; // Используем порт из Render или 3000 по умолчанию

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TIMERS_FILE = path.join(__dirname, 'timers.json');
const RESPAWN_HOURS = 9;
const VARIANCE_HOURS = 1;

function getRandomRespawnTime() {
    const minHours = RESPAWN_HOURS - VARIANCE_HOURS;
    const maxHours = RESPAWN_HOURS + VARIANCE_HOURS;
    const randomHours = Math.random() * (maxHours - minHours) + minHours;
    return Math.floor(randomHours * 60 * 60 * 1000); // в миллисекундах, целое число
}

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
    const respawnMs = getRandomRespawnTime();
    timers[bossName] = Date.now() + respawnMs;
    saveTimers(timers);
    res.json({ success: true, respawnTime: timers[bossName] });
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