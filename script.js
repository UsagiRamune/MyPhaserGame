document.addEventListener('DOMContentLoaded', () => {
    const fadeInElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null, // สังเกตการณ์ใน viewport
        rootMargin: '0px',
        threshold: 0.1 // ให้ทำงานเมื่อเห็น element 10%
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // เมื่อแสดงผลแล้ว ให้หยุดสังเกตการณ์ element นี้เพื่อ performance ที่ดี
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeInElements.forEach(el => {
        observer.observe(el);
    });
});