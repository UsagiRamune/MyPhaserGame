document.addEventListener('DOMContentLoaded', () => {

    // =======================================================
    // FIREBASE REALTIME DATABASE LOGIC
    // =======================================================
  
    const firebaseConfig = {
      apiKey: "AIzaSyBJVtg4H11aRJkHtLxGvTcxZeShUbCo59M",
      authDomain: "realtimedata-phasergame.firebaseapp.com",
      databaseURL: "https://realtimedata-phasergame-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "realtimedata-phasergame",
      storageBucket: "realtimedata-phasergame.appspot.com",
      messagingSenderId: "892307010351",
      appId: "1:892307010351:web:6d1f4759b17e6da58327da"
    };
  
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const leaderboardRef = database.ref('leaderboard');
  
    // =======================================================
    // RECEIVE SCORE FROM GAME
    // =======================================================
    window.addEventListener('message', async (event) => {
      const data = event.data;
      if (data && data.type === 'submitScore') {
        console.log('🎮 Score received from game:', data);
  
        try {
          // ค้นหาชื่อซ้ำในฐานข้อมูล
          const snapshot = await leaderboardRef
            .orderByChild('playerName')
            .equalTo(data.name)
            .once('value');
  
          if (snapshot.exists()) {
            // ถ้ามีชื่อเดิมอยู่แล้ว → อัปเดตคะแนนถ้าสูงกว่าเดิม + เพิ่ม playCount
            snapshot.forEach((child) => {
              const ref = leaderboardRef.child(child.key);
              const oldData = child.val();
              const newScore = Math.max(oldData.score || 0, data.score);
              const newPlayCount = (oldData.playCount || 0) + 1;
              ref.update({
                score: newScore,
                playCount: newPlayCount,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
              });
            });
          } else {
            // ถ้ายังไม่มีชื่อเดิม → สร้างใหม่
            await leaderboardRef.push({
              playerName: data.name,
              score: data.score,
              playCount: 1,
              createdAt: firebase.database.ServerValue.TIMESTAMP
            });
          }
  
          console.log('✅ Score submitted to Realtime DB!');
        } catch (error) {
          console.error('Error submitting score:', error);
        }
      }
    });
  
    // =======================================================
    // REALTIME LEADERBOARD UI
    // =======================================================
    function updateLeaderboardUI(scores) {
      const leaderboardBody = document.querySelector("#leaderboard tbody");
      const comingSoonText = document.querySelector("#leaderboard .text-body-secondary");
      leaderboardBody.innerHTML = '';
  
      if (scores && scores.length > 0) {
        if (comingSoonText) comingSoonText.style.display = 'none';
      } else {
        if (comingSoonText) comingSoonText.style.display = 'block';
        leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center">- No scores yet -</td></tr>`;
        return;
      }
  
      scores.forEach((player, index) => {
        const rank = index + 1;
        const row = `
          <tr>
            <th scope="row">${rank}</th>
            <td>${player.playerName || 'Anonymous'}</td>
            <td>${player.score || 0}</td>
            <td>${player.playCount || 0}</td>
          </tr>
        `;
        leaderboardBody.innerHTML += row;
      });
    }
  
    // =======================================================
    // FETCH & LISTEN FOR REALTIME UPDATES
    // =======================================================
    leaderboardRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
      const scores = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          scores.push(child.val());
        });
  
        // เรียงลำดับ: คะแนนมากก่อน, ถ้าคะแนนเท่ากัน → createdAt น้อย (เล่นก่อน) อยู่บน
        scores.sort((a, b) => {
            if ((b.score || 0) === (a.score || 0)) {
              // ถ้าคะแนนเท่ากัน ให้ดู playCount น้อยมาก่อนไม่ใช่เยอะ
              if ((b.playCount || 0) === (a.playCount || 0)) {
                // ถ้า playCount เท่ากัน ก็ให้ดู createdAt
                return (a.createdAt || 0) - (b.createdAt || 0);  // คนที่มาเล่นก่อนจะอยู่สูงกว่า
              }
              return (a.playCount || 0) - (b.playCount || 0);  // ให้คนที่เล่นน้อยกว่าอยู่บน
            }
            return (b.score || 0) - (a.score || 0);  // ถ้าคะแนนไม่เท่ากัน ก็จัดอันดับตามคะแนน
          });
  
        updateLeaderboardUI(scores.slice(0, 10));
      } else {
        updateLeaderboardUI([]);
      }
    }, (errorObject) => {
      console.error("❌ Read failed: " + errorObject.name);
      const leaderboardBody = document.querySelector("#leaderboard tbody");
      leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading scores. Check Firebase Rules.</td></tr>`;
    });
  
    // =======================================================
    // UI LOGIC (หน้าหลัก)
    // =======================================================
    const fadeInElements = document.querySelectorAll('.fade-in');
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.2 };
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, observerOptions);
    fadeInElements.forEach(el => { observer.observe(el); });
  
    const gameContainer = document.getElementById('game-container');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');
    fullscreenBtn.addEventListener('click', () => {
      gameContainer.classList.add('fullscreen');
      if (gameContainer.requestFullscreen) gameContainer.requestFullscreen();
      else if (gameContainer.webkitRequestFullscreen) gameContainer.webkitRequestFullscreen();
      else if (gameContainer.msRequestFullscreen) gameContainer.msRequestFullscreen();
    });
    exitFullscreenBtn.addEventListener('click', () => {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
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
  
    const playOverlay = document.getElementById('play-overlay');
    const gameIframe = document.querySelector('#game-container iframe');
    playOverlay.addEventListener('click', () => {
      if (gameIframe.src !== gameIframe.dataset.src) {
        gameIframe.src = gameIframe.dataset.src;
      }
      playOverlay.classList.add('hidden');
    }, { once: true });
  });