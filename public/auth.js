const firebaseConfig = {
  apiKey: "AIzaSyBJVtg4H11aRJkHtLxGvTcxZeShUbCo59M",
  authDomain: "realtimedata-phasergame.firebaseapp.com",
  databaseURL: "https://realtimedata-phasergame-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "realtimedata-phasergame",
  storageBucket: "realtimedata-phasergame.firebasestorage.app",
  messagingSenderId: "892307010351",
  appId: "1:892307010351:web:6d1f4759b17e6da58327da",
  measurementId: "G-0BDM24FDDT"
};

// --- INITIALIZE & SIGN-IN ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
console.log("🔥 Firebase Auth Initialized!");

auth.onAuthStateChanged(user => {
  if (user) {
    console.log("✅ Player is ready with UID:", user.uid);
  } else {
    auth.signInAnonymously().catch(error => {
      console.error("❌ Anonymous sign-in failed:", error);
    });
  }
});

// --- HELPER FUNCTION ---
// ฟังก์ชันสำหรับให้ script.js เรียกใช้เพื่อเอา Token
async function getCurrentUserIdToken() {
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken(true); // true เพื่อ force refresh token
  }
  // ถ้า user ยังไม่พร้อม ให้รอแป๊บนึง
  await new Promise(resolve => setTimeout(resolve, 1500));
  const newUser = auth.currentUser;
  if (!newUser) return null;
  return newUser.getIdToken(true);
}