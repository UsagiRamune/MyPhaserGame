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

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (data && data.type === 'submitScore') {
            console.log('Score received from game:', data);
            
            leaderboardRef.push({
                playerName: data.name,
                score: data.score,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            }).catch((error) => {
                console.error('Error submitting score:', error);
            });
        }
    });

    function updateLeaderboardUI(scores) {
        const leaderboardBody = document.querySelector("#leaderboard tbody");
        const comingSoonText = document.querySelector("#leaderboard .text-body-secondary");
        leaderboardBody.innerHTML = '';

        if (scores && scores.length > 0) {
            if(comingSoonText) comingSoonText.style.display = 'none';
        } else {
            if(comingSoonText) comingSoonText.style.display = 'block';
            leaderboardBody.innerHTML = `<tr><td colspan="3" class="text-center">- No scores yet -</td></tr>`;
            return;
        }

        scores.forEach((player, index) => {
            const rank = index + 1;
            const row = `
                <tr>
                    <th scope="row">${rank}</th>
                    <td>${player.playerName || 'Anonymous'}</td>
                    <td>${player.score || 0}</td>
                </tr>
            `;
            leaderboardBody.innerHTML += row;
        });
    }

    leaderboardRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
        const scores = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                scores.push(childSnapshot.val());
            });
            updateLeaderboardUI(scores.reverse());
        } else {
            updateLeaderboardUI([]);
        }
    }, (errorObject) => {
        console.error("The read failed: " + errorObject.name);
        const leaderboardBody = document.querySelector("#leaderboard tbody");
        leaderboardBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error loading scores. Check Security Rules in Firebase.</td></tr>`;
    });

    // =======================================================
    // UI LOGIC (โค้ดส่วนนี้ถูกต้องแล้ว)
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
        if (gameContainer.requestFullscreen) { gameContainer.requestFullscreen(); }
        else if (gameContainer.webkitRequestFullscreen) { gameContainer.webkitRequestFullscreen(); }
        else if (gameContainer.msRequestFullscreen) { gameContainer.msRequestFullscreen(); }
    });
    exitFullscreenBtn.addEventListener('click', () => {
        if (document.exitFullscreen) { document.exitFullscreen(); }
        else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
        else if (document.msExitFullscreen) { document.msExitFullscreen(); }
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