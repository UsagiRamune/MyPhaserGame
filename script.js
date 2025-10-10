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

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const leaderboardCollection = db.collection('leaderboard');

// 3. ฟังก์ชันสำหรับดึงและแสดงข้อมูล
async function displayLeaderboard() {
    const leaderboardTableBody = document.querySelector("#leaderboard tbody");
    leaderboardTableBody.innerHTML = ''; // ล้างข้อมูลเก่า

    try {
        const snapshot = await leaderboardCollection.orderBy('score', 'desc').limit(10).get();

        if (snapshot.empty) {
            leaderboardTableBody.innerHTML = '<tr><td colspan="3">ยังไม่มีข้อมูลคะแนน</td></tr>';
            return;
        }

        snapshot.forEach((doc, index) => {
            const data = doc.data();
            const row = `
                <tr>
                    <th scope="row">${index + 1}</th>
                    <td>${escapeHTML(data.name)}</td>
                    <td>${data.score}</td>
                </tr>
            `;
            leaderboardTableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error getting leaderboard: ", error);
        leaderboardTableBody.innerHTML = '<tr><td colspan="3">ไม่สามารถโหลดข้อมูลได้</td></tr>';
    }
}

async function submitScoreToFirebase(name, score) {
    try {
        await leaderboardCollection.add({
            name: name,
            score: parseInt(score, 10), // แปลง score เป็นตัวเลข
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Score submitted successfully!");
        displayLeaderboard(); // รีเฟรช leaderboard ทันที
    } catch (error) {
        console.error("Error adding document: ", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ... โค้ดเดิมใน DOMContentLoaded ...

    // 6. เพิ่ม Event Listener สำหรับรับข้อมูลจาก iframe
    window.addEventListener('message', (event) => {
        // เพื่อความปลอดภัย ควรเช็ค origin ของ event
        // if (event.origin !== 'your-game-url') return;

        const data = event.data;
        if (data && data.type === 'submitScore') {
            submitScoreToFirebase(data.name, data.score);
        }
    });
});

// ฟังก์ชันป้องกัน XSS (ควรมี)
function escapeHTML(str) {
    var p = document.createElement("p");
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {

    // --- Scroll-reveal animation ---
    const fadeInElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                 entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    fadeInElements.forEach(el => {
        observer.observe(el);
    });


    // --- Fullscreen functionality ---
    const gameContainer = document.getElementById('game-container');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');

    fullscreenBtn.addEventListener('click', () => {
        gameContainer.classList.add('fullscreen');
        if (gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen();
        } else if (gameContainer.webkitRequestFullscreen) { /* Safari */
            gameContainer.webkitRequestFullscreen();
        } else if (gameContainer.msRequestFullscreen) { /* IE11 */
            gameContainer.msRequestFullscreen();
        }
    });

    exitFullscreenBtn.addEventListener('click', () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    });
    
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            gameContainer.classList.remove('fullscreen');
            fullscreenBtn.classList.remove('d-none');
            exitFullscreenBtn.classList.add('d-none');
        } else {
            fullscreenBtn.classList.add('d-none');
            exitFullscreenBtn.classList.remove('d-none');
        }
    });

    // --- เพิ่มเข้ามา! Logic สำหรับ Click to Play ---
    const playOverlay = document.getElementById('play-overlay');
    const gameIframe = document.querySelector('#game-container iframe');

    playOverlay.addEventListener('click', () => {
        // เช็คก่อนว่ายังไม่ได้โหลดเกม แล้วค่อยสั่งโหลด
        if (gameIframe.src !== gameIframe.dataset.src) {
            gameIframe.src = gameIframe.dataset.src;
        }

        // ซ่อน overlay หลังจากกด
        playOverlay.classList.add('hidden');
    }, { once: true }); // ให้ Event นี้ทำงานแค่ครั้งเดียวพอ

});