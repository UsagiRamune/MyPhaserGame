const { https } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const express = require("express");
const cors = require("cors");
const { authenticate } = require('./controller/middleware/authenticate'); // <-- เรียกใช้ "ตัวตรวจบัตร"

// --- INITIALIZE ---
initializeApp();
const app = express();
const db = require("firebase-admin/database").getDatabase();

// --- APP-LEVEL MIDDLEWARE ---
const allowedOrigins = [ /* ... */ ];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// --- ROUTES ---
app.post("/submit-score", authenticate, async (req, res) => {
    // Logic การบันทึกคะแนนทั้งหมดมาอยู่ตรงนี้
    // (เอามาจาก authController.js ในคำตอบที่แล้ว)
    const { name, score } = req.body;
    const { uid } = req.user;

    if (!name || typeof name !== "string" || name.trim().length < 1 || name.trim().length > 15 || score === undefined || typeof score !== "number" || score < 0) {
        return res.status(400).send({ error: "Bad Input: Invalid name or score." });
    }
    
    try {
        const userScoreRef = db.ref(`leaderboard/${uid}`);
        const snapshot = await userScoreRef.once("value");
        const safeName = name.trim();

        if (snapshot.exists()) {
            const oldData = snapshot.val();
            await userScoreRef.update({
                playerName: safeName,
                score: Math.max(oldData.score || 0, score),
                playCount: (oldData.playCount || 0) + 1,
                updatedAt: Date.now(),
            });
        } else {
            await userScoreRef.set({
                playerName: safeName, score, playCount: 1, createdAt: Date.now(),
            });
        }
        return res.status(201).send({ message: `Score submitted for ${safeName}` });
    } catch (error) {
        console.error("🔥 Error in submitScore:", error);
        return res.status(500).send({ error: "Internal Server Error." });
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

// NEW: Bug Report Endpoint
app.post("/submit-bug", async (req, res) => {
  const { bugType, description } = req.body;

  if (!bugType || !description || typeof description !== "string" || description.trim().length < 10) {
    return res.status(400).send({ error: "Bad Input: Please provide a valid bug type and a description of at least 10 characters." });
  }

  try {
    const bugReportsRef = db.ref("bug_reports");
    await bugReportsRef.push({
      type: bugType,
      description: description.trim(),
      timestamp: Date.now(),
      status: "new", // default status
    });
    return res.status(201).send({ message: "Bug report submitted successfully. Thank you!" });
  } catch (error) {
    console.error("🔥 Error in /submit-bug:", error);
    return res.status(500).send({ error: "Internal Server Error." });
  }
});


console.log("✅ Function setup complete. Exporting 'api'...");

exports.api = https.onRequest({region: "asia-southeast1"}, app);