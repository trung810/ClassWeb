require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.static('./'));

const DATA_FILE = path.join(__dirname, 'assets/data/messages.txt');
const COOLDOWN_FILE = path.join(__dirname, 'assets/data/cooldowns.json');

// Use the key from the .env file
const OPENAI_API_KEY = process.env.OPENAI_KEY;

// Check cooldown
const isOnCooldown = (ip) => {
    if (!fs.existsSync(COOLDOWN_FILE)) return false;
    const cooldowns = JSON.parse(fs.readFileSync(COOLDOWN_FILE));
    if (!cooldowns[ip]) return false;

    const hoursPast = (Date.now() - cooldowns[ip]) / (1000 * 60 * 60);
    return hoursPast < 24;
};

// Open AI moderation. If API key is available, uncomment these lines

// app.post('/send-message', async (req, res) => {
//     const userIp = req.ip;
//     const { message } = req.body;

//     // -cooldown check- //

//     // if (isOnCooldown(userIp)) {
//     //     return res.status(429).json({ error: "24-hour cooldown active." });
//     // }

//     try {
//         // 1. OpenAI Moderation Check
//         const modResponse = await axios.post(
//             'https://api.openai.com/v1/moderations',
//             { input: message },
//             { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` } }
//         );

//         if (modResponse.data.results[0].flagged) {
//             return res.status(400).json({ error: "Inappropriate content detected." });
//         }

//         // 2. Save Message
            // fs.appendFileSync(
            //     DATA_FILE,
            //     `${safeName} | ${safeMsg}\n`
            // );
//         // 3. Update Cooldown
//         const cooldowns = fs.existsSync(COOLDOWN_FILE) ? JSON.parse(fs.readFileSync(COOLDOWN_FILE)) : {};
//         cooldowns[userIp] = Date.now();
//         fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(cooldowns));

//         res.json({ success: true });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// });

app.post('/send-message', async (req, res) => {
    try {
        const { name, message } = req.body;

        const safeName = (name || "Anonymous").replace(/\n/g, " ");
        const safeMsg = message.replace(/\n/g, " ");

        fs.appendFileSync(
            DATA_FILE,
            `${safeName} | ${safeMsg}\n`
        );

        res.json({ success: true });

    } catch (err) {
        console.error("SERVER ERROR:", err.message);
        res.status(500).json({ error: "Could not save message." });
    }
});


app.get('/messages', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.send("");
    res.send(fs.readFileSync(DATA_FILE, 'utf-8'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));