/* GSAP 3 — xuất hiện lúc tải và lúc cuộn. Không đụng form đặt phòng. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var net = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (reduce || (net && net.saveData)) return;

  document.documentElement.classList.add('gsap-on');

  var ease = 'power3.out';
  gsap.from('.hero-title', { y: 24, duration: 0.7, ease: ease, clearProps: 'transform' });
  gsap.from('.hero-tagline', { y: 16, duration: 0.6, delay: 0.08, ease: ease, clearProps: 'transform' });
  gsap.from('.hero-actions', { y: 12, duration: 0.55, delay: 0.14, ease: ease, clearProps: 'transform' });

  var mobile = window.matchMedia('(max-width: 768px)').matches;
  if (mobile) return;
  gsap.registerPlugin(ScrollTrigger);

  function arm(el) {
    if (!el || el.dataset.gsap) return;
    el.dataset.gsap = '1';
    gsap.from(el, {
      y: 18,
      duration: 0.55,
      ease: 'power2.out',
      immediateRender: false,
      clearProps: 'transform',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  }

  function scan() {
    document.querySelectorAll('.section-header, .room-card, .tour-arch-card, .review-card, .duo-card, .kp-card, .gallery-item, .faq-item, .price-card, .news-card, .combo-card').forEach(arm);
  }

  var refreshTimer = 0;
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 150);
  }

  scan();
  ['rooms-grid', 'tours-grid', 'reviews-grid', 'kp-grid', 'gallery-grid', 'faq-list', 'price-board', 'news-grid', 'combo'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    new MutationObserver(function () {
      scan();
      scheduleRefresh();
    }).observe(el, { childList: true });
  });
  window.addEventListener('load', scheduleRefresh);
})();
