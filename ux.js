/* Nâng tương tác — bám DOM hiện có, không đổi luồng đặt phòng. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) document.documentElement.classList.add('ux-on');

  const $ = (id) => document.getElementById(id);
  const SLIDES = [
    { img: 'images/hero-san-may.webp', cap: 'Bình minh trên biển mây Tà Xùa' },
    { img: 'images/phong-view-may.webp', cap: 'Phòng gỗ nhìn thẳng ra thung lũng' },
    { img: 'images/hoang-hon-quan-cafe.webp', cap: 'Cà phê trên Đỉnh Gió lúc hoàng hôn' },
  ];

  function rise(el, i) {
    if (!el || el.dataset.ux) return;
    if (document.documentElement.classList.contains('gsap-on')) return;
    el.dataset.ux = '1';
    if (reduce) return;
    el.classList.add('ux-prep');
    el.style.transitionDelay = Math.min(i || 0, 8) * 60 + 'ms';
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('ux-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    io.observe(el);
  }

  function watch(sel) {
    document.querySelectorAll(sel).forEach((el, i) => rise(el, i));
  }

  function ripple(e) {
    const b = e.target.closest('.btn-hero, .btn-book-room, .btn-submit-booking, .sb-book, .btn-nav-book');
    if (!b || reduce) return;
    const r = document.createElement('span');
    r.className = 'ux-ripple';
    const box = b.getBoundingClientRect();
    r.style.left = (e.clientX - box.left) + 'px';
    r.style.top = (e.clientY - box.top) + 'px';
    b.appendChild(r);
    setTimeout(() => r.remove(), 560);
  }

  function dragScroll(el) {
    if (!el || el.dataset.drag) return;
    el.dataset.drag = '1';
    let sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button, input, select, textarea')) return;
      moved = false; sx = e.clientX; sl = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) moved = true;
      el.scrollLeft = sl - dx;
    });
    el.addEventListener('click', (e) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }, true);
  }

  function heroSlider() {
    const hero = $('trang-chu');
    if (!hero || hero.dataset.slider) return;
    hero.dataset.slider = '1';
    const content = hero.querySelector('.hero-content');
    const cap = document.createElement('div');
    cap.className = 'ux-promo';
    cap.textContent = SLIDES[0].cap;
    if (content) content.appendChild(cap);
    const ui = document.createElement('div');
    ui.className = 'ux-hero-ui';
    ui.innerHTML = '<button type="button" aria-label="Ảnh trước">‹</button><div class="ux-dots"></div><button type="button" aria-label="Ảnh sau">›</button>';
    hero.appendChild(ui);
    const dots = ui.querySelector('.ux-dots');
    let i = 0, timer;
    SLIDES.forEach((_, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Banner ' + (n + 1));
      b.addEventListener('click', () => go(n, true));
      dots.appendChild(b);
    });
    function paint(instant) {
      const incoming = layers[shown ^ 1];
      const current = layers[shown];
      incoming.style.backgroundImage = "linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.45)), url('" + SLIDES[i].img + "')";
      if (instant || reduce) {
        layers.forEach((el) => { el.style.transition = 'none'; el.style.opacity = '0'; });
        incoming.style.opacity = '1';
      } else {
        incoming.style.transition = '';
        current.style.transition = '';
        incoming.style.opacity = '1';
        current.style.opacity = '0';
        cap.style.opacity = '0';
        setTimeout(() => { cap.style.opacity = '1'; }, 280);
      }
      shown ^= 1;
      cap.textContent = SLIDES[i].cap;
      dots.querySelectorAll('button').forEach((b, n) => b.classList.toggle('on', n === i));
    }
    function go(n, manual) {
      i = (n + SLIDES.length) % SLIDES.length;
      paint(false);
      if (manual) arm();
    }
    function arm() {
      clearInterval(timer);
      if (reduce) return;
      timer = setInterval(() => go(i + 1), 5200);
    }
    const layers = [document.createElement('div'), document.createElement('div')];
    layers.forEach((el) => { el.className = 'ux-hero-bg'; el.setAttribute('aria-hidden', 'true'); });
    hero.prepend(layers[1]);
    hero.prepend(layers[0]);
    let shown = 0;
    ui.children[0].addEventListener('click', () => go(i - 1, true));
    ui.children[2].addEventListener('click', () => go(i + 1, true));
    paint(true);
    arm();
    if (!reduce) {
      window.addEventListener('scroll', () => {
        if (window.innerWidth < 760) return;
        const pos = 'center ' + Math.round(window.scrollY * 0.28) + 'px';
        layers.forEach((el) => { el.style.backgroundPosition = pos; });
      }, { passive: true });
    }
  }

  function skeleton() {
    ['rooms-grid', 'tours-grid', 'gallery-grid', 'reviews-grid', 'faq-list'].forEach((id) => {
      const el = $(id);
      if (!el || !/Đang tải/.test(el.textContent)) return;
      const n = id === 'faq-list' ? 4 : 3;
      el.className = (el.className + ' ux-skel').trim();
      el.innerHTML = Array.from({ length: n }, () => '<div class="ux-skel-card"></div>').join('');
    });
  }

  function filters() {
    const grid = $('rooms-grid');
    const head = document.querySelector('#hang-phong .section-header');
    if (!grid || !head || $('ux-filters')) return;
    const box = document.createElement('div');
    box.className = 'ux-filters';
    box.id = 'ux-filters';
    box.innerHTML = '<label>Giá tối đa / đêm <input type="range" id="ux-price" min="500000" max="2000000" step="50000" value="2000000"><output id="ux-price-out">Tất cả</output></label><label>Số khách <input type="range" id="ux-pax" min="1" max="6" value="2"><output id="ux-pax-out">2 khách</output></label>';
    head.after(box);
    const price = $('ux-price'), pax = $('ux-pax');
    const apply = () => {
      const max = Number(price.value);
      $('ux-price-out').textContent = max >= 2000000 ? 'Tất cả' : Number(max).toLocaleString('vi-VN') + ' đ';
      $('ux-pax-out').textContent = pax.value + ' khách';
      grid.querySelectorAll('.room-card').forEach((card) => {
        const p = Number(card.dataset.price || 0);
        card.hidden = p > 0 && p > max;
      });
    };
    price.addEventListener('input', apply);
    pax.addEventListener('input', () => {
      apply();
      const g = $('bk-guests');
      if (g && !g.value) g.value = pax.value + ' người lớn';
    });
    new MutationObserver(apply).observe(grid, { childList: true });
  }

  function dock() {
    if ($('ux-dock')) return;
    const bar = document.createElement('form');
    bar.className = 'ux-dock';
    bar.id = 'ux-dock';
    bar.innerHTML = '<label>Nhận phòng<input type="date" id="ux-in"></label><label>Trả phòng<input type="date" id="ux-out"></label><label>Khách <output id="ux-dock-pax">2</output><input type="range" id="ux-dock-guests" min="1" max="6" value="2"></label><button type="submit">Đặt phòng</button>';
    document.body.appendChild(bar);
    const today = new Date();
    const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const inn = $('ux-in'), out = $('ux-out');
    inn.min = iso(today);
    inn.value = iso(today);
    const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
    out.value = iso(tmr);
    $('ux-dock-guests').addEventListener('input', (e) => { $('ux-dock-pax').textContent = e.target.value; });
    window.addEventListener('scroll', () => {
      bar.classList.toggle('on', window.scrollY > 520);
    }, { passive: true });
    bar.addEventListener('submit', (e) => {
      e.preventDefault();
      if (typeof openBookingModal === 'function') openBookingModal('', 0);
      const a = $('bk-checkin'), b = $('bk-checkout'), g = $('bk-guests');
      if (a) { a.value = inn.value; a.dispatchEvent(new Event('change')); }
      if (b) { b.value = out.value; b.dispatchEvent(new Event('change')); }
      if (g) { g.value = $('ux-dock-guests').value + ' người lớn'; g.dispatchEvent(new Event('input')); }
      if (typeof validateDates === 'function') validateDates();
      if (typeof calculateTotal === 'function') calculateTotal();
    });
  }

  function bookingExtras() {
    const form = $('booking-form-step1');
    if (!form || form.dataset.ux) return;
    form.dataset.ux = '1';
    const dates = $('bk-checkin') && $('bk-checkin').closest('div[style]');
    if (dates && !form.querySelector('.ux-chips')) {
      const chips = document.createElement('div');
      chips.className = 'ux-chips';
      chips.innerHTML = '<button type="button" data-off="0" data-n="1">Đêm nay</button><button type="button" data-off="1" data-n="1">Ngày mai</button><button type="button" data-off="0" data-n="2">2 đêm</button>';
      dates.before(chips);
      chips.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        chips.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
        const start = new Date();
        start.setDate(start.getDate() + Number(btn.dataset.off));
        const end = new Date(start);
        end.setDate(start.getDate() + Number(btn.dataset.n));
        const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        $('bk-checkin').value = iso(start);
        $('bk-checkout').value = iso(end);
        if (typeof validateDates === 'function') validateDates();
        if (typeof calculateTotal === 'function') calculateTotal();
      });
    }
    const guests = $('bk-guests');
    if (guests && !form.querySelector('.ux-range')) {
      const wrap = document.createElement('div');
      wrap.className = 'form-group';
      wrap.innerHTML = '<label>Số khách (kéo nhanh)</label><div class="ux-range"><input type="range" min="1" max="8" value="2" id="ux-guest-range"><output>2 người</output></div>';
      guests.closest('.form-group').before(wrap);
      const range = wrap.querySelector('input');
      const out = wrap.querySelector('output');
      range.addEventListener('input', () => {
        out.textContent = range.value + ' người';
        guests.value = range.value + ' người lớn';
        guests.dispatchEvent(new Event('input'));
      });
    }
  }

  let lbUrls = [];
  let lbIndex = 0;
  function lightboxNav() {
    const box = $('lightbox');
    const img = $('lightbox-img');
    if (!box || !img || box.dataset.ux) return;
    box.dataset.ux = '1';
    const prev = document.createElement('button');
    const next = document.createElement('button');
    prev.className = 'ux-lb-nav ux-lb-prev';
    next.className = 'ux-lb-nav ux-lb-next';
    prev.type = next.type = 'button';
    prev.textContent = '‹';
    next.textContent = '›';
    prev.setAttribute('aria-label', 'Ảnh trước');
    next.setAttribute('aria-label', 'Ảnh sau');
    box.appendChild(prev);
    box.appendChild(next);
    function collect() {
      lbUrls = [...document.querySelectorAll('.gallery-item[data-full], #cf-photos figure[data-full], #cf-guest figure[data-full]')].map((el) => ({
        url: el.dataset.full,
        alt: el.dataset.alt || el.getAttribute('aria-label') || '',
      }));
    }
    function show(step) {
      if (!lbUrls.length) collect();
      if (!lbUrls.length) return;
      lbIndex = (lbIndex + step + lbUrls.length) % lbUrls.length;
      img.classList.add('ux-fade');
      setTimeout(() => {
        img.src = lbUrls[lbIndex].url;
        img.alt = lbUrls[lbIndex].alt || '';
        img.classList.remove('ux-fade');
      }, reduce ? 0 : 160);
    }
    prev.addEventListener('click', (e) => { e.stopPropagation(); show(-1); });
    next.addEventListener('click', (e) => { e.stopPropagation(); show(1); });
    img.addEventListener('click', (e) => e.stopPropagation());
    let x0 = null;
    box.addEventListener('pointerdown', (e) => { if (e.target === box) return; x0 = e.clientX; });
    box.addEventListener('pointerup', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 48) { e.stopPropagation(); show(dx < 0 ? 1 : -1); }
    });
    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('active')) return;
      if (e.key === 'ArrowRight') show(1);
      if (e.key === 'ArrowLeft') show(-1);
    });
    const orig = window.openLightbox;
    if (typeof orig === 'function') {
      window.openLightbox = function (url, alt) {
        collect();
        lbIndex = Math.max(0, lbUrls.findIndex((x) => x.url === url));
        orig(url, alt);
      };
    }
  }

  function spinRoom() {
    const body = $('info-body');
    if (!body) return;
    const main = body.querySelector('.rd-main');
    const thumbs = [...body.querySelectorAll('.rd-thumbs img')];
    if (!main || thumbs.length < 2 || main.dataset.spin) return;
    main.dataset.spin = '1';
    const urls = thumbs.map((img) => img.currentSrc || img.src);
    let idx = Math.max(0, urls.indexOf(main.currentSrc || main.src));
    let x0 = null;
    const note = document.createElement('p');
    note.className = 'ux-spin-note';
    note.textContent = 'Kéo ngang ảnh để xoay xem các góc phòng.';
    main.after(note);
    main.style.touchAction = 'pan-y';
    main.addEventListener('pointerdown', (e) => { x0 = e.clientX; main.setPointerCapture(e.pointerId); });
    main.addEventListener('pointerup', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 30) return;
      idx = (idx + (dx < 0 ? 1 : -1) + urls.length) % urls.length;
      main.style.opacity = '0.35';
      main.src = urls[idx];
      requestAnimationFrame(() => { main.style.opacity = '1'; });
    });
    const strip = body.querySelector('.rd-thumbs');
    if (strip) { strip.classList.add('ux-row'); dragScroll(strip); }
  }

  function markRails() {
    const g = $('gallery-grid');
    if (g && g.querySelector('.gallery-item')) {
      g.classList.add('ux-swipe');
      dragScroll(g);
      if (!g.previousElementSibling || !g.previousElementSibling.classList.contains('ux-hint')) {
        const h = document.createElement('p');
        h.className = 'ux-hint';
        h.textContent = 'Kéo hoặc vuốt ngang để xem ảnh. Chạm để mở toàn màn hình.';
        g.before(h);
      }
    }
    const kp = $('kp-grid');
    if (kp && kp.children.length) { kp.classList.add('ux-row'); dragScroll(kp); }
    const menu = $('cf-menu');
    if (menu && menu.children.length > 1) { menu.classList.add('ux-row'); dragScroll(menu); }
    watch('.room-card, .tour-arch-card, .review-card, .gallery-item, .kp-card, .faq-item, .combo-card, .section-wrap');
  }

  document.addEventListener('pointerdown', ripple);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && $(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  skeleton();
  heroSlider();
  filters();
  dock();
  lightboxNav();
  bookingExtras();
  const modal = $('booking-modal');
  if (modal) new MutationObserver(bookingExtras).observe(modal, { attributes: true, attributeFilter: ['class'] });
  ['gallery-grid', 'kp-grid', 'cf-menu', 'rooms-grid', 'tours-grid', 'reviews-grid', 'faq-list', 'info-body'].forEach((id) => {
    const el = $(id);
    if (!el) return;
    new MutationObserver(() => { markRails(); spinRoom(); }).observe(el, { childList: true, subtree: true });
  });
  markRails();
  watch('.section-wrap, .trust-strip, .duo-card, .cta-band');
})();
