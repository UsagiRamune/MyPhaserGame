document.addEventListener('DOMContentLoaded', () => {

  // =======================================================
  // PRELOADER LOGIC
  // =======================================================
  // Simulate loading and then reveal the page
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 2800); // 2.8 seconds, slightly longer than the loading bar animation

  // =======================================================
  // CONFIG 
  // =======================================================
  const API_ENDPOINT = "http://127.0.0.1:5001/realtimedata-phasergame/asia-southeast1/api";
  
  // =======================================================
  // RECEIVE SCORE FROM GAME & CALL API
  // =======================================================
  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (data && data.type === 'submitScore') {
      console.log('🎮 Score received from game:', data);

      try {
        const response = await fetch(`${API_ENDPOINT}/submit-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: data.name, score: data.score }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Score submitted via API!', result);
        
        // Wait a bit before refetching to allow DB to update
        setTimeout(fetchAndRenderLeaderboard, 500);

      } catch (error) {
        console.error('❌ Error submitting score via API:', error);
        alert('Failed to submit score. Please try again.');
      }
    }
  });

  // =======================================================
  // LEADERBOARD STATE & UI FUNCTIONS
  // =======================================================
  let allScores = [];
  let rankMap = {};
  let sortField = 'score'; // Default sort field
  let sortDirection = 'desc'; // Default sort direction

  function buildCanonicalRankMap(list) {
    const canonical = [...list].sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.playerName || '').localeCompare(b.playerName || '');
    });
    const map = {};
    canonical.forEach((p, i) => { map[p._key] = i + 1; });
    return map;
  }

  function updateLeaderboardUI(displayArray) {
    const leaderboardBody = document.querySelector("#leaderboard tbody");
    const placeholderText = document.querySelector("#leaderboard-placeholder");
    leaderboardBody.innerHTML = ''; // Clear previous entries
    
    if (displayArray && displayArray.length > 0) {
      if (placeholderText) placeholderText.classList.add('d-none');
      
      displayArray.forEach((player) => {
        const canonicalRank = rankMap[player._key];
        const row = document.createElement('tr');
        row.innerHTML = `
          <th scope="row">${canonicalRank}</th>
          <td>${player.playerName || 'Anonymous'}</td>
          <td>${player.score || 0}</td>
          <td>${player.playCount || 0}</td>
        `;
        leaderboardBody.appendChild(row);
      });
    } else {
      if (placeholderText) placeholderText.classList.remove('d-none');
      leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center">- No scores yet -</td></tr>`;
    }
  }
  
  function sortScoresForDisplay() {
    let sorted = [];
    if (!sortField || !sortDirection) {
      sorted = [...allScores].sort((a, b) => (rankMap[a._key] || 999) - (rankMap[b._key] || 999));
    } else {
       if (sortField === 'ranking') {
          sorted = [...allScores].sort((a, b) => {
            const rankA = rankMap[a._key] || 999;
            const rankB = rankMap[b._key] || 999;
            return sortDirection === 'asc' ? (rankA - rankB) : (rankB - rankA);
          });
        } else if (sortField === 'score') {
          sorted = [...allScores].sort((a, b) => {
            const aScore = a.score || 0; const bScore = b.score || 0;
            const scoreDiff = sortDirection === 'asc' ? aScore - bScore : bScore - aScore;
            if (scoreDiff !== 0) return scoreDiff;
            return (a.playerName || '').localeCompare(b.playerName || '');
          });
        } else if (sortField === 'playCount') {
          sorted = [...allScores].sort((a, b) => {
            const aPlay = a.playCount || 0; const bPlay = b.playCount || 0;
            const playDiff = sortDirection === 'asc' ? aPlay - bPlay : bPlay - aPlay;
            if (playDiff !== 0) return playDiff;
            return (a.playerName || '').localeCompare(b.playerName || '');
          });
        } else if (sortField === 'name') {
            sorted = [...allScores].sort((a, b) => {
                const nameA = a.playerName || '';
                const nameB = b.playerName || '';
                const comparison = nameA.localeCompare(nameB);
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }
    }
    updateLeaderboardUI(sorted.slice(0, 10));
  }
  
  function updateSortIndicators() {
    document.querySelectorAll(".sortable").forEach(th => {
      const indicator = th.querySelector(".sort-indicator");
      const field = th.dataset.field;
      indicator.textContent = ""; indicator.style.opacity = 0.3;
      if (sortField === field && sortDirection) {
        indicator.textContent = sortDirection === "asc" ? "▲" : "▼";
        indicator.style.opacity = 1;
      }
    });
  }

  document.addEventListener("click", (e) => {
    const th = e.target.closest(".sortable");
    if (!th) return;
    const field = th.dataset.field;
    if (sortField === field) {
      sortDirection = (sortDirection === "asc") ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = (field === 'name' || field === 'ranking') ? "asc" : "desc";
    }
    updateSortIndicators();
    sortScoresForDisplay();
  });
  
  // =======================================================
  // FETCH LEADERBOARD FROM API & RENDER
  // =======================================================
  async function fetchAndRenderLeaderboard() {
    try {
      const response = await fetch(`${API_ENDPOINT}/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const scoresFromAPI = await response.json();

      allScores = scoresFromAPI;
      rankMap = buildCanonicalRankMap(allScores);
      sortScoresForDisplay();
      updateSortIndicators();

    } catch (error) {
      console.error("❌ Read failed via API: ", error);
      const leaderboardBody = document.querySelector("#leaderboard tbody");
      leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading scores. Is the emulator running?</td></tr>`;
    }
  }

  // --- STARTUP ---
  fetchAndRenderLeaderboard();

  // =======================================================
  // UI LOGIC (fullscreen, overlay, fade-in)
  // =======================================================
  const fadeInElements = document.querySelectorAll('.fade-in');
  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { root: null, rootMargin: '0px', threshold: 0.2 });
  fadeInElements.forEach(el => fadeInObserver.observe(el));

  const gameContainer = document.getElementById('game-container');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');
  fullscreenBtn.addEventListener('click', () => {
      if (gameContainer.requestFullscreen) {
          gameContainer.requestFullscreen();
      }
  });
  exitFullscreenBtn.addEventListener('click', () => {
      if (document.exitFullscreen) {
          document.exitFullscreen();
      }
  });

  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    document.body.classList.toggle('game-is-fullscreen', isFullscreen); 
    gameContainer.classList.toggle('fullscreen', isFullscreen);
    fullscreenBtn.classList.toggle('d-none', isFullscreen);
    exitFullscreenBtn.classList.toggle('d-none', !isFullscreen);
  });

  const playOverlay = document.getElementById('play-overlay');
  const gameIframe = document.querySelector('#game-container iframe');
  playOverlay.addEventListener('click', () => {
    if (gameIframe.src !== gameIframe.dataset.src) {
      gameIframe.src = gameIframe.dataset.src;
    }
    playOverlay.classList.add('hidden');
  }, { once: true });

  // =======================================================
  // SCROLL-BASED UI LOGIC
  // =======================================================

  // --- Navbar Active State on Scroll ---
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href').substring(1) === id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { root: null, rootMargin: "-50% 0px -50% 0px", threshold: 0 });

  sections.forEach(section => {
    sectionObserver.observe(section);
  });

  // --- Back to Top Button ---
  const backToTopBtn = document.getElementById('back-to-top-btn');

  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('hero').scrollIntoView({
        behavior: 'smooth'
    });
  });
  
  // =======================================================
  // BUG REPORT FORM LOGIC
  // =======================================================
  const bugReportForm = document.getElementById('bug-report-form');
  const reportFeedback = document.getElementById('report-feedback');

  bugReportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitButton = bugReportForm.querySelector('button[type="submit"]');
      const bugType = document.getElementById('bug-type').value;
      const description = document.getElementById('bug-description').value;

      // Disable button to prevent multiple submissions
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      reportFeedback.textContent = '';
      reportFeedback.className = '';

      try {
          const response = await fetch(`${API_ENDPOINT}/submit-bug`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bugType, description }),
          });

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.error || 'Failed to submit report.');
          }

          reportFeedback.textContent = result.message;
          reportFeedback.classList.add('success');
          bugReportForm.reset(); // Clear the form

      } catch (error) {
          console.error('❌ Error submitting bug report:', error);
          reportFeedback.textContent = `Error: ${error.message}`;
          reportFeedback.classList.add('error');
      } finally {
          // Re-enable button
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Report';
      }
  });

});