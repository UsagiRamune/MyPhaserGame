document.addEventListener('DOMContentLoaded', () => {

  // =======================================================
  // FIREBASE REALTIME DATABASE CONFIG
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
  // RECEIVE SCORE FROM GAME (เหมือนเดิม)
  // =======================================================
  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (data && data.type === 'submitScore') {
      console.log('🎮 Score received from game:', data);

      try {
        const snapshot = await leaderboardRef
          .orderByChild('playerName')
          .equalTo(data.name)
          .once('value');

        if (snapshot.exists()) {
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
  // STATE: All scores + rank map + sorting
  // =======================================================
  let allScores = []; // each entry: { _key, playerName, score, playCount, createdAt, updatedAt }
  let rankMap = {};   // _key -> canonical rank (1 = best)
  let sortField = null;      // null = no user sort (use canonical display order)
  let sortDirection = null;  // "asc" / "desc"

  // =======================================================
  // Build canonical rank map (global ranking)
  // canonical rules:
  //  - score desc (higher better)
  //  - playCount asc (fewer plays better)
  //  - createdAt asc (earlier play better)
  // =======================================================
  function buildCanonicalRankMap(list) {
    const canonical = [...list].sort((a, b) => {
      if ((b.score || 0) === (a.score || 0)) {
        if ((a.playCount || 0) === (b.playCount || 0)) {
          return (a.createdAt || 0) - (b.createdAt || 0);
        }
        return (a.playCount || 0) - (b.playCount || 0); // fewer plays is better
      }
      return (b.score || 0) - (a.score || 0); // higher score is better
    });

    const map = {};
    canonical.forEach((p, i) => { map[p._key] = i + 1; });
    return map;
  }

  // =======================================================
  // Update leaderboard UI (use canonical rank for the # column)
  // displayArray = array of entries to show (already sorted for display)
  // =======================================================
  function updateLeaderboardUI(displayArray) {
    const leaderboardBody = document.querySelector("#leaderboard tbody");
    const comingSoonText = document.querySelector("#leaderboard .text-body-secondary");
    leaderboardBody.innerHTML = '';

    if (displayArray && displayArray.length > 0) {
      if (comingSoonText) comingSoonText.style.display = 'none';
    } else {
      if (comingSoonText) comingSoonText.style.display = 'block';
      leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center">- No scores yet -</td></tr>`;
      return;
    }

    displayArray.forEach((player, i) => {
      // canonical rank (global)
      const canonicalRank = rankMap[player._key] || (i + 1);
      const row = `
        <tr>
          <th scope="row">${canonicalRank}</th>
          <td>${player.playerName || 'Anonymous'}</td>
          <td>${player.score || 0}</td>
          <td>${player.playCount || 0}</td>
        </tr>
      `;
      leaderboardBody.innerHTML += row;
    });
  }

  // =======================================================
  // Sorting for display (user-controlled) with proper tie-breakers
  // - If no sortField => display canonical order
  // - If sortField === 'ranking' => use rankMap ordering (and toggle)
  // - If sortField === 'score' => primary = score (asc/desc)
  //      tie -> playCount (always fewer plays considered better)
  //      tie -> createdAt : if sortDirection === 'desc' -> earlier first; if 'asc' -> later first
  // - If sortField === 'playCount' => primary = playCount
  //      tie -> score (higher better)
  //      tie -> createdAt : same inversion logic
  // =======================================================
  function sortScoresForDisplay() {
    let sorted = [];

    if (!sortField || !sortDirection) {
      // default: canonical order
      sorted = [...allScores].sort((a, b) => {
        if ((b.score || 0) === (a.score || 0)) {
          if ((a.playCount || 0) === (b.playCount || 0)) {
            return (a.createdAt || 0) - (b.createdAt || 0);
          }
          return (a.playCount || 0) - (b.playCount || 0);
        }
        return (b.score || 0) - (a.score || 0);
      });
    } else if (sortField === 'ranking') {
      // sort by canonical rank (rankMap)
      sorted = [...allScores].map(p => ({ ...p, rank: rankMap[p._key] || 999999 }));
      // if sortDirection === 'desc' => show best rank (1) first => sort by rank asc
      // if sortDirection === 'asc'  => show worst rank first => sort by rank desc
      sorted.sort((a, b) => {
        return sortDirection === 'desc' ? (a.rank - b.rank) : (b.rank - a.rank);
      });
    } else if (sortField === 'score') {
      sorted = [...allScores].sort((a, b) => {
        const aScore = a.score || 0;
        const bScore = b.score || 0;
        if (aScore !== bScore) {
          return sortDirection === 'asc' ? (aScore - bScore) : (bScore - aScore);
        }
        // score equal -> tie-breaker: playCount (fewer playCount considered better)
        const aPlay = a.playCount || 0;
        const bPlay = b.playCount || 0;
        if (aPlay !== bPlay) {
          return (aPlay - bPlay); // always fewer plays => considered "better" (i.e., up in canonical)
        }
        // tie in score & playCount -> createdAt: invert based on sortDirection
        if (sortDirection === 'asc') {
          // when showing low->high, prefer players who played later (createdAt larger) to appear first
          return (b.createdAt || 0) - (a.createdAt || 0);
        } else {
          // when showing high->low, prefer earlier players
          return (a.createdAt || 0) - (b.createdAt || 0);
        }
      });
    } else if (sortField === 'playCount') {
      sorted = [...allScores].sort((a, b) => {
        const aPlay = a.playCount || 0;
        const bPlay = b.playCount || 0;
        if (aPlay !== bPlay) {
          return sortDirection === 'asc' ? (aPlay - bPlay) : (bPlay - aPlay);
        }
        // tie in playCount -> tie-breaker: score (higher better)
        const aScore = a.score || 0;
        const bScore = b.score || 0;
        if (aScore !== bScore) {
          return (bScore - aScore);
        }
        // tie -> createdAt invert similarly to above
        if (sortDirection === 'asc') {
          return (b.createdAt || 0) - (a.createdAt || 0);
        } else {
          return (a.createdAt || 0) - (b.createdAt || 0);
        }
      });
    } else {
      // fallback to canonical
      sorted = [...allScores].sort((a, b) => {
        if ((b.score || 0) === (a.score || 0)) {
          if ((a.playCount || 0) === (b.playCount || 0)) {
            return (a.createdAt || 0) - (b.createdAt || 0);
          }
          return (a.playCount || 0) - (b.playCount || 0);
        }
        return (b.score || 0) - (a.score || 0);
      });
    }

    updateLeaderboardUI(sorted.slice(0, 10));
  }

  // =======================================================
  // Update sort indicators (no indicator at start)
  // =======================================================
  function updateSortIndicators() {
    document.querySelectorAll(".sortable").forEach(th => {
      const indicator = th.querySelector(".sort-indicator");
      const field = th.dataset.field;
      if (sortField === field && sortDirection) {
        indicator.textContent = sortDirection === "asc" ? "▲" : "▼";
        indicator.style.opacity = 1;
      } else {
        indicator.textContent = "";
        indicator.style.opacity = 0.3;
      }
    });
  }

  // Click handler for sortable headers (delegated)
  document.addEventListener("click", (e) => {
    const th = e.target.closest(".sortable");
    if (!th) return;
    const field = th.dataset.field;
    if (!field) return;

    if (sortField === field) {
      // toggle direction
      sortDirection = (sortDirection === "asc") ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "desc"; // default when selecting a column
    }

    updateSortIndicators();
    sortScoresForDisplay();
  });

  // =======================================================
  // FETCH & LISTEN FOR REALTIME UPDATES
  // =======================================================
  leaderboardRef.on('value', (snapshot) => {
    const scores = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const val = child.val() || {};
        scores.push({
          _key: child.key,
          playerName: val.playerName,
          score: val.score,
          playCount: val.playCount,
          createdAt: val.createdAt,
          updatedAt: val.updatedAt
        });
      });

      allScores = scores;
      rankMap = buildCanonicalRankMap(allScores);

      // render according to current sort state
      sortScoresForDisplay();
      updateSortIndicators();
    } else {
      allScores = [];
      rankMap = {};
      updateLeaderboardUI([]);
    }
  }, (errorObject) => {
    console.error("❌ Read failed: " + (errorObject && errorObject.name));
    const leaderboardBody = document.querySelector("#leaderboard tbody");
    leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading scores. Check Firebase Rules.</td></tr>`;
  });

  // =======================================================
  // UI LOGIC (fullscreen, overlay, fade-in) — ไม่มีการเปลี่ยนแปลง
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
