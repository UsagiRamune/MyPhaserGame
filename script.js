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