/* GSAP 3 — xuất hiện lúc tải và lúc cuộn. Không đụng form đặt phòng. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var net = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (reduce || (net && net.saveData)) return;

  document.documentElement.classList.add('gsap-on');

  var ease = 'power3.out';
  gsap.from('.hero-title', { y: 32, autoAlpha: 0, duration: 0.85, ease: ease });
  gsap.from('.hero-tagline', { y: 22, autoAlpha: 0, duration: 0.7, delay: 0.12, ease: ease });
  gsap.from('.hero-actions', { y: 16, autoAlpha: 0, duration: 0.65, delay: 0.22, ease: ease });

  var mobile = window.matchMedia('(max-width: 768px)').matches;
  if (mobile) return;
  gsap.registerPlugin(ScrollTrigger);

  function arm(el) {
    if (!el || el.dataset.gsap) return;
    el.dataset.gsap = '1';
    gsap.from(el, {
      y: 24,
      autoAlpha: 0,
      duration: 0.65,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  }

  function scan() {
    document.querySelectorAll('.section-header, .room-card, .tour-arch-card, .review-card, .duo-card, .kp-card, .gallery-item, .faq-item').forEach(arm);
  }

  var refreshTimer = 0;
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 150);
  }

  scan();
  ['rooms-grid', 'tours-grid', 'reviews-grid', 'kp-grid', 'gallery-grid', 'faq-list'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    new MutationObserver(function () {
      scan();
      scheduleRefresh();
    }).observe(el, { childList: true });
  });
  window.addEventListener('load', scheduleRefresh);
})();
