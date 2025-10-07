const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname + '/public'));

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('MONGODB_URI not set!');
    process.exit(1);
}

const client = new MongoClient(uri);
let db;

const MIN_RESPAWN_HOURS = 9;
const MAX_RESPAWN_HOURS = 11;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('raidtracker').collection('timers');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('DB connection error:', err);
        process.exit(1);
    }
}

connectDB();

async function loadTimers() {
    try {
        const data = await db.find({}).toArray();
        const timers = {};
        data.forEach(doc => {
            timers[doc.bossName] = doc;
        });
        return timers;
    } catch (err) {
        console.error('Error loading timers:', err);
        return {};
    }
}

async function saveTimer(bossName, data) {
    try {
        await db.updateOne(
            { bossName },
            { $set: data },
            { upsert: true }
        );
    } catch (err) {
        console.error('Error saving timer:', err);
    }
}

async function deleteTimer(bossName) {
    try {
        await db.deleteOne({ bossName });
    } catch (err) {
        console.error('Error deleting timer:', err);
    }
}

app.get('/api/timers', async (req, res) => {
    const timers = await loadTimers();
    res.json(timers);
});

app.post('/api/bosses/:boss/kill', async (req, res) => {
    const bossName = decodeURIComponent(req.params.boss);
    const killTime = Date.now();
    const timerData = {
        bossName,
        killTime,
        minRespawn: killTime + (MIN_RESPAWN_HOURS * 60 * 60 * 1000),
        maxRespawn: killTime + (MAX_RESPAWN_HOURS * 60 * 60 * 1000)
    };
    await saveTimer(bossName, timerData);
    res.json({ success: true, minRespawn: timerData.minRespawn, maxRespawn: timerData.maxRespawn });
});

app.post('/api/bosses/:boss/reset', async (req, res) => {
    const bossName = decodeURIComponent(req.params.boss);
    await deleteTimer(bossName);
    res.json({ success: true });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});