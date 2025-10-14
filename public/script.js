document.addEventListener('DOMContentLoaded', () => {

  // =======================================================
  // PRELOADER & ANNOUNCEMENT LOGIC
  // =======================================================
  document.body.classList.add('loading'); // Prevent scrolling

  const announcementModalEl = document.getElementById('announcementModal');
  const announcementModal = new bootstrap.Modal(announcementModalEl);
  const modalCountdownSpan = document.getElementById('modal-countdown');
  let countdownInterval;

  const preloader = document.getElementById('preloader');

  const showTheDamnModal = () => {
    if (!sessionStorage.getItem('announcementShown')) {
      announcementModal.show();
      sessionStorage.setItem('announcementShown', 'true');
    }
  };

  preloader.addEventListener('transitionend', showTheDamnModal, { once: true });

  setTimeout(() => {
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  }, 2800);

  function startModalCountdown() {
      let secondsLeft = 15;
      modalCountdownSpan.textContent = `Closing in ${secondsLeft}s...`;

      countdownInterval = setInterval(() => {
          secondsLeft--;
          if (secondsLeft > 0) {
              modalCountdownSpan.textContent = `Closing in ${secondsLeft}s...`;
          } else {
              if (announcementModalEl.classList.contains('show')) {
                announcementModal.hide();
              }
          }
      }, 1000);
  }
  
  announcementModalEl.addEventListener('shown.bs.modal', () => {
    startModalCountdown();
  });

  announcementModalEl.addEventListener('hidden.bs.modal', () => {
    clearInterval(countdownInterval);
    document.body.focus(); 
  });


  // =======================================================
  // CONFIG 
  // =======================================================
  const API_ENDPOINT = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:5001/realtimedata-phasergame/asia-southeast1/api"
    : "https://asia-southeast1-realtimedata-phasergame.cloudfunctions.net/api";

  
  // =======================================================
  // TOWER SHOWCASE LOGIC
  // =======================================================
  const towerData = {
    fire: {
        name: "🔥 FIRE TOWER",
        color: "#ff6a00",
        stats: { damage: "15 (Base)", rate: "Medium", chance: "20% Burn" },
        passive: "<strong>Passive Skill:</strong> โจมตีปกติมีโอกาสติดสถานะ <span class='text-danger'>Burn</span> (ลดเลือดศัตรูเรื่อยๆ)",
        skill: "<strong>Lv.5 Skill:</strong> เรียก <span class='text-danger'>Meteor</span> ตกใส่กลุ่มศัตรู สร้างความเสียหายเป็นวงกว้าง",
        icon: "bi-fire",
    },
    ice: {
        name: "🧊 ICE TOWER",
        color: "#66ccff",
        stats: { damage: "8 (Base)", rate: "Medium", chance: "25% Slow" },
        passive: "<strong>Passive Skill:</strong> โจมตีปกติมีโอกาสทำให้ศัตรู <span class='text-info'>Slow</span> (เคลื่อนที่ช้าลง)",
        skill: "<strong>Lv.5 Skill:</strong> <span class='text-info'>แช่แข็ง</span>ศัตรู และเมื่อหมดเวลาจะระเบิดสร้างความเสียหาย",
        icon: "bi-snow",
    },
    lightning: {
        name: "⚡ LIGHTNING TOWER",
        color: "#ffff66",
        stats: { damage: "10 (Base)", rate: "Medium", chance: "25% Chain" },
        passive: "<strong>Passive Skill:</strong> โจมตีปกติมีโอกาสชิ่งไปโดนศัตรูตัวอื่นที่อยู่ใกล้เคียง",
        skill: "<strong>Lv.5 Skill:</strong> ยิง <span class='text-warning'>Chain Lightning</span> ที่รุนแรงขึ้น และทำให้ติดสตั๊นชั่วครู่",
        icon: "bi-lightning-charge-fill",
    },
    poison: {
        name: "☠️ POISON TOWER",
        color: "#8fce00",
        stats: { damage: "6 (Base)", rate: "Medium", chance: "30% Poison" },
        passive: "<strong>Passive Skill:</strong> โจมตีปกติมีโอกาสติดสถานะ <span class='text-success'>Poison</span> (ลดเลือดศัตรูอย่างรุนแรง)",
        skill: "<strong>Lv.5 Skill:</strong> สร้าง <span class='text-success'>บ่อพิษ</span> บนพื้น สร้างความเสียหายต่อเนื่อง",
        icon: "bi-virus",
    },
    arrow: {
        name: "🏹 ARROW TOWER",
        color: "#ffffff",
        stats: { damage: "12 (Base)", rate: "Medium", chance: "25% Crit" },
        passive: "<strong>Passive Skill:</strong> โจมตีปกติมีโอกาสยิงติด <span class='text-light'>Critical</span> สร้างความเสียหายรุนแรงขึ้น",
        synergy: "<strong>Synergy Bonus:</strong> วาง Arrow Tower ติดกันเพื่อเพิ่มพลังโจมตีและความเร็วในการยิงให้แก่กันและกัน!",
        skill: "<strong>Lv.5 Skill:</strong> เข้าสู่สถานะ <span class='text-light'>Rapid Fire</span> เพิ่มความเร็วโจมตีและโอกาสติดคริ",
        icon: "bi-bullseye",
    },
    mana: {
        name: "🔮 MANA TOWER",
        color: "#9966ff",
        stats: { damage: "8 (Base)", rate: "Medium", chance: "0% Special" },
        passive: "<strong>Passive Skill:</strong> โจมตีได้ แต่มีความสามารถหลักคือเมื่อนำไปผสมจะได้รับโบนัสมานา",
        skill: "<strong>Lv.5 Skill:</strong> <span class='text-info'>สร้างมานา</span> ให้ผู้เล่นเรื่อยๆ ยิ่งเลเวลสูงยิ่งสร้างได้เยอะขึ้น",
        icon: "bi-gem",
    }
  };

  const showcaseContainer = document.getElementById('tower-showcase-section');
  const displayImageContainer = showcaseContainer.querySelector('.tower-display-image-container');
  const displayInfoContainer = showcaseContainer.querySelector('.tower-display-info');
  const selectionBar = showcaseContainer.querySelector('.tower-selection-bar');

  function updateTowerDisplay(towerKey) {
    const data = towerData[towerKey];
    if (!data) return;
    
    displayImageContainer.style.opacity = 0;
    displayInfoContainer.style.opacity = 0;

    setTimeout(() => {
        document.documentElement.style.setProperty('--tower-glow-color', data.color);

        displayImageContainer.innerHTML = `<i class="bi ${data.icon} display-1" style="color: ${data.color}; text-shadow: 0 0 20px ${data.color};"></i>`;
        
        const synergyBox = data.synergy ? `
            <div class="ability-box">
                <p class="mb-0">${data.synergy}</p>
            </div>
        ` : '';

        displayInfoContainer.innerHTML = `
            <h4 style="color: ${data.color};">${data.name}</h4>
            <div class="tower-stats">
                <div class="stat-item">
                    <small>Base Damage</small>
                    <strong>${data.stats.damage}</strong>
                </div>
                <div class="stat-item">
                    <small>Attack Rate</small>
                    <strong>${data.stats.rate}</strong>
                </div>
                <div class="stat-item">
                    <small>Special</small>
                    <strong>${data.stats.chance}</strong>
                </div>
            </div>
            <div class="ability-box">
                <p class="mb-0">${data.passive}</p>
            </div>
            ${synergyBox}
            <div class="ability-box">
                <p class="mb-0">${data.skill}</p>
            </div>
        `;

        displayImageContainer.style.opacity = 1;
        displayInfoContainer.style.opacity = 1;

        document.querySelectorAll('.tower-select-icon').forEach(icon => {
            icon.classList.remove('active');
        });
        document.querySelector(`.tower-select-icon[data-tower="${towerKey}"]`).classList.add('active');
    }, 200);
  }

  // --- START: โค้ดที่กูเพิ่มให้ ---
  let autoScrollInterval;

  const startAutoScroll = () => {
    stopAutoScroll(); // เคลียร์ของเก่าทิ้งก่อน กันมันซ้อนกัน
    autoScrollInterval = setInterval(() => {
      // เช็คว่าเลื่อนไปจนสุดหรือยัง
      if (selectionBar.scrollLeft >= selectionBar.scrollWidth - selectionBar.clientWidth) {
        // ถ้าสุดแล้วให้กลับไปเริ่มใหม่
        selectionBar.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // ถ้ายังไม่สุด ก็เลื่อนไปทางขวาทีละนิด
        selectionBar.scrollLeft += 1;
      }
    }, 25); // ความเร็วในการเลื่อน (ยิ่งน้อยยิ่งเร็ว)
  };

  const stopAutoScroll = () => {
    clearInterval(autoScrollInterval);
  };
  // --- END: โค้ดที่กูเพิ่มให้ ---

  Object.keys(towerData).forEach(key => {
    const data = towerData[key];
    const iconContainer = document.createElement('div');
    iconContainer.className = 'tower-select-icon';
    iconContainer.dataset.tower = key;
    iconContainer.style.setProperty('--tower-glow-color', data.color);
    
    const iconEl = document.createElement('i');
    iconEl.className = `bi ${data.icon}`;
    iconEl.style.fontSize = '2rem';
    iconEl.style.color = data.color;

    iconContainer.appendChild(iconEl);

    iconContainer.addEventListener('click', () => {
        stopAutoScroll(); // หยุดเลื่อนเมื่อ user คลิก
        updateTowerDisplay(key);
    });

    selectionBar.appendChild(iconContainer);
  });

  updateTowerDisplay('fire');
  
  // --- START: โค้ดที่กูเพิ่มให้ (ต่อ) ---
  // เริ่มเลื่อนอัตโนมัติ
  startAutoScroll();

  // หยุดเมื่อเอาเมาส์ไปชี้
  selectionBar.addEventListener('mouseenter', stopAutoScroll);
  // เริ่มเลื่อนใหม่เมื่อเอาเมาส์ออก
  selectionBar.addEventListener('mouseleave', startAutoScroll);
  // --- END: โค้ดที่กูเพิ่มให้ (ต่อ) ---


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
  let sortField = 'score';
  let sortDirection = 'desc';

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
    leaderboardBody.innerHTML = '';
    
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
      leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading scores. Is the API running?</td></tr>`;
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
          bugReportForm.reset();

      } catch (error) {
          console.error('❌ Error submitting bug report:', error);
          reportFeedback.textContent = `Error: ${error.message}`;
          reportFeedback.classList.add('error');
      } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Report';
      }
  });

});