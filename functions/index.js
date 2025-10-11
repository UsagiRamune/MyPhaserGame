const {https} = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getDatabase} = require("firebase-admin/database");
const express = require("express");
const cors = require("cors");
const allowedOrigins = [
    'https://realtimedata-phasergame.web.app',
    'https://kheeplayableads.netlify.app',
    'http://127.0.0.1:5500', 
    'http://localhost:5000'   
];


console.log("🚀 Initializing Cloud Function (SDK v3+ style)...");

// --- INITIALIZE ---
try {
  initializeApp();
} catch (e) {
  console.log("Admin already initialized.");
}
const db = getDatabase();
const app = express();

// --- MIDDLEWARE ---
app.use(cors({
  origin: function(origin, callback) {
    // อนุญาตถ้าเป็นหนึ่งใน whitelist หรือถ้าไม่ได้ระบุ origin (เช่น postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

// --- ROUTES ---

app.post("/submit-score", async (req, res) => {
  const {name, score} = req.body;
  if (
    !name ||
    typeof name !== "string" ||
    name.trim().length < 1 ||
    name.trim().length > 15 ||
    score === undefined ||
    typeof score !== "number" ||
    score < 0
  ) {
    return res.status(400).send({error: "Bad Input: Invalid name or score."});
  }
  try {
    const leaderboardRef = db.ref("leaderboard");
    const safeName = name.trim();
    const snapshot = await leaderboardRef
        .orderByChild("playerName")
        .equalTo(safeName)
        .once("value");

    if (snapshot.exists()) {
      let userKey = null;
      let oldData = null;
      snapshot.forEach((child) => {
        userKey = child.key;
        oldData = child.val();
      });
      const newScore = Math.max(oldData.score || 0, score);
      const newPlayCount = (oldData.playCount || 0) + 1;
      await db.ref(`leaderboard/${userKey}`).update({
        score: newScore,
        playCount: newPlayCount,
        updatedAt: Date.now(),
      });
    } else {
      await leaderboardRef.push({
        playerName: safeName,
        score: score,
        playCount: 1,
        createdAt: Date.now(),
      });
    }
    return res.status(201).send({message: `Score submitted for ${safeName}`});
  } catch (error) {
    console.error("🔥 Error in /submit-score:", error);
    return res.status(500).send({error: "Internal Server Error."});
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
    const snapshot = await db.ref("leaderboard").once("value");
    if (snapshot.exists()) {
      const scores = [];
      snapshot.forEach((child) => {
        scores.push({_key: child.key, ...child.val()});
      });
      return res.status(200).json(scores);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error("🔥 Error in /leaderboard:", error);
    return res.status(500).send({error: "Internal Server Error."});
  }
});

console.log("✅ Function setup complete. Exporting 'api'...");

exports.api = https.onRequest({region: "asia-southeast1"}, app);