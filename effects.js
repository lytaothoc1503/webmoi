/* Hạt 3D — lớp nền độc lập. Không gọi hàm đặt phòng, không sửa dữ liệu. */
(function () {
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var net = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  function blocked() {
    if (motionQuery.matches) return true;
    if (net && net.saveData) return true;
    return false;
  }

  if (blocked()) return;

  var EMBER = '184, 97, 46';
  var BRASS = '212, 165, 116';
  var PINE = '36, 53, 48';
  var STORE = 'nx-omni-intensity';
  var FOCAL = 460;

  var mouse = { x: null, y: null, radius: 175 };
  var tick = 0;
  var mult = 1;
  var particles = [];
  var heroParticles = [];
  var running = true;
  var canvas, ctx, control, output;
  var viewW = 0;
  var viewH = 0;
  var lastFrame = 0;
  var yaw = 0;
  var pitch = 0.06;

  function readMult() {
    var saved = 1;
    try { saved = parseFloat(localStorage.getItem(STORE)); } catch (e) { saved = 1; }
    if (!isFinite(saved)) saved = 1;
    return Math.min(1.6, Math.max(0.2, saved));
  }

  function isMobile() {
    return window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  }

  function budget(hero) {
    var mobile = isMobile();
    if (hero) return mobile ? 20 : 44;
    return mobile ? 32 : 78;
  }

  function spawn(w, h, hero) {
    var palette = hero ? [BRASS, BRASS, EMBER, PINE] : [EMBER, PINE, BRASS];
    return {
      x: (Math.random() - 0.5) * w * (hero ? 0.92 : 1.15),
      y: (Math.random() - 0.5) * h * (hero ? 0.72 : 0.9),
      z: hero ? Math.random() * 340 : 60 + Math.random() * 860,
      vx: (Math.random() - 0.5) * 0.42,
      vy: (Math.random() - 0.5) * 0.32,
      vz: 0.28 + Math.random() * 0.55,
      radius: (hero ? 1.7 : 1.25) + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      rgb: palette[(Math.random() * palette.length) | 0],
    };
  }

  function fillList(list, count, w, h, hero) {
    if (list.length > count) list.length = count;
    while (list.length < count) list.push(spawn(w, h, hero));
  }

  function project(p) {
    var cy = Math.cos(yaw);
    var sy = Math.sin(yaw);
    var cx = Math.cos(pitch);
    var sx = Math.sin(pitch);
    var x1 = p.x * cy - p.z * sy;
    var z1 = p.x * sy + p.z * cy;
    var y2 = p.y * cx - z1 * sx;
    var z2 = p.y * sx + z1 * cx;
    var depth = FOCAL + z2;
    if (depth < 48) depth = 48;
    var s = FOCAL / depth;
    return {
      x: viewW * 0.5 + x1 * s,
      y: viewH * 0.46 + y2 * s,
      s: s,
      depth: depth,
    };
  }

  function stepParticle(p, hero) {
    var speed = 0.55 + mult * 0.5;
    p.x += p.vx * speed;
    p.y += p.vy * speed;
    p.z -= p.vz * speed;
    var bx = viewW * 0.62;
    var by = viewH * 0.5;
    if (p.x < -bx) p.x = bx;
    if (p.x > bx) p.x = -bx;
    if (p.y < -by) p.y = by;
    if (p.y > by) p.y = -by;
    var far = hero ? 380 : 980;
    if (p.z < -70) p.z = far;
    if (p.z > far) p.z = -20;
  }

  function drawField(list, isHero, mx, my) {
    var linkDist = (isHero ? 118 : 132) * (0.75 + mult * 0.28);
    var zLimit = isHero ? 110 : 150;
    var omniRadius = mouse.radius * (0.8 + mult * 0.25);
    var projected = [];
    var i, j, p, pr, p2, a, b;

    for (i = 0; i < list.length; i++) {
      p = list[i];
      stepParticle(p, isHero);
      pr = project(p);
      projected.push(pr);
      if (mx !== null && my !== null) {
        var mdx = pr.x - mx;
        var mdy = pr.y - my;
        var mDistSq = mdx * mdx + mdy * mdy;
        var omniSq = omniRadius * omniRadius;
        if (mDistSq < omniSq && mDistSq > 1) {
          var mDist = Math.sqrt(mDistSq);
          var pull = (1 - mDist / omniRadius) * 0.22 * mult;
          p.x -= (mdx / Math.max(pr.s, 0.35)) * pull * 0.08;
          p.y -= (mdy / Math.max(pr.s, 0.35)) * pull * 0.08;
          p.z -= pull * 1.4;
        }
      }
    }

    if (mx !== null && my !== null) {
      var halo = (isHero ? 0.14 : 0.09) * mult;
      var g = ctx.createRadialGradient(mx, my, 0, mx, my, omniRadius);
      g.addColorStop(0, 'rgba(212, 165, 116, ' + halo.toFixed(3) + ')');
      g.addColorStop(0.55, 'rgba(184, 97, 46, ' + (halo * 0.35).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(212, 165, 116, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mx, my, omniRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (i = 0; i < list.length; i++) {
      a = projected[i];
      for (j = i + 1; j < list.length; j++) {
        if (Math.abs(list[i].z - list[j].z) > zLimit) continue;
        b = projected[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var distSq = dx * dx + dy * dy;
        if (distSq >= linkDist * linkDist) continue;
        var dist = Math.sqrt(distSq);
        var near = 1 - ((a.depth + b.depth) * 0.5 - 280) / 900;
        if (near < 0.08) near = 0.08;
        var lineAlpha = (1 - dist / linkDist) * (isHero ? 0.34 : 0.2) * mult * near;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHero
          ? 'rgba(212, 165, 116, ' + lineAlpha.toFixed(3) + ')'
          : 'rgba(184, 97, 46, ' + lineAlpha.toFixed(3) + ')';
        ctx.lineWidth = 0.7 * Math.min(a.s, b.s) * (0.8 + mult * 0.3);
        ctx.stroke();
      }
    }

    var order = [];
    for (i = 0; i < list.length; i++) order.push(i);
    order.sort(function (ia, ib) { return projected[ib].depth - projected[ia].depth; });

    for (i = 0; i < order.length; i++) {
      p = list[order[i]];
      pr = projected[order[i]];
      var fog = 1 - (pr.depth - 240) / 980;
      if (fog < 0.12) fog = 0.12;
      if (fog > 1) fog = 1;
      var pulse = 0.7 + 0.3 * Math.sin(tick * 0.03 + p.phase);
      var alpha = Math.min(0.92, (isHero ? 0.72 : 0.5) * pulse * mult * fog);
      var rad = p.radius * pr.s * (1.15 + mult * 0.35);
      if (rad < 0.4) continue;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, rad * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.rgb + ', ' + (alpha * 0.18).toFixed(3) + ')';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.rgb + ', ' + alpha.toFixed(3) + ')';
      ctx.fill();
      if (mx !== null && my !== null) {
        var sx = pr.x - mx;
        var sy = pr.y - my;
        var sd = Math.sqrt(sx * sx + sy * sy);
        if (sd < omniRadius && sd > 1) {
          var mAlpha = (1 - sd / omniRadius) * (isHero ? 0.5 : 0.32) * mult * fog;
          ctx.beginPath();
          ctx.moveTo(pr.x, pr.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = 'rgba(212, 165, 116, ' + mAlpha.toFixed(3) + ')';
          ctx.lineWidth = 0.9 * pr.s;
          ctx.stroke();
        }
      }
    }
  }

  function sizeCanvas(force) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (!force && w === viewW && h === viewH && canvas.width) return;
    viewW = w;
    viewH = h;
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1 : 1.25);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles.length = 0;
    heroParticles.length = 0;
    fillList(particles, budget(false), w, h, false);
    fillList(heroParticles, budget(true), w, h, true);
  }

  function heroBand() {
    var hero = document.getElementById('trang-chu');
    if (!hero) return null;
    var r = hero.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= viewH) return null;
    return r;
  }

  function frame(now) {
    if (!running) return;
    var cap = 32;
    if (now - lastFrame < cap) {
      requestAnimationFrame(frame);
      return;
    }
    lastFrame = now || 0;
    sizeCanvas(false);
    var mx = mouse.x;
    var my = mouse.y;
    var targetYaw = mx === null ? tick * 0.00035 : (mx / viewW - 0.5) * 0.7;
    var targetPitch = my === null ? 0.08 : (my / viewH - 0.5) * 0.38;
    yaw += (targetYaw - yaw) * 0.06;
    pitch += (targetPitch - pitch) * 0.06;

    ctx.clearRect(0, 0, viewW, viewH);
    drawField(particles, false, mx, my);
    var band = heroBand();
    if (band) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, band.top, viewW, Math.max(0, band.bottom - band.top));
      ctx.clip();
      drawField(heroParticles, true, mx, my);
      ctx.restore();
    }
    tick += 1;
    if (running) requestAnimationFrame(frame);
  }

  function mount() {
    var css = document.createElement('style');
    css.textContent = [
      '#nx-omni{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;}',
      '#nx-ctl{position:fixed;left:14px;bottom:16px;z-index:1100;display:flex;align-items:center;gap:8px;',
      'background:rgba(61,35,20,.92);color:#f6e7d4;border-radius:999px;padding:6px 10px 6px 12px;',
      'font:600 11px/1 Montserrat,sans-serif;letter-spacing:.04em;box-shadow:0 8px 20px rgba(0,0,0,.22);}',
      '#nx-ctl input{width:92px;accent-color:#d4a574;cursor:pointer;}',
      '#nx-ctl output{min-width:28px;color:#d4a574;font-variant-numeric:tabular-nums;}',
      '@media (max-width:768px){#nx-ctl{bottom:76px;left:10px;padding:5px 8px 5px 10px;}#nx-ctl input{width:72px;}}',
    ].join('');
    document.head.appendChild(css);

    canvas = document.createElement('canvas');
    canvas.id = 'nx-omni';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    ctx = canvas.getContext('2d', { alpha: true });

    control = document.createElement('label');
    control.id = 'nx-ctl';
    control.innerHTML = 'Hạt 3D <input id="nx-intensity" type="range" min="0.2" max="1.6" step="0.1" aria-label="Độ mạnh hiệu ứng hạt 3D"> <output id="nx-intensity-out"></output>';
    document.body.appendChild(control);
    var slider = control.querySelector('input');
    output = control.querySelector('output');
    mult = readMult();
    slider.value = String(mult);
    output.textContent = mult.toFixed(1);
    slider.addEventListener('input', function () {
      mult = Math.min(1.6, Math.max(0.2, parseFloat(slider.value) || 1));
      output.textContent = mult.toFixed(1);
      try { localStorage.setItem(STORE, String(mult)); } catch (e) { /* bỏ qua nếu trình duyệt chặn */ }
    });

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener('blur', function () { mouse.x = null; mouse.y = null; });
    document.addEventListener('mouseleave', function () { mouse.x = null; mouse.y = null; });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
        return;
      }
      if (!running && !blocked()) {
        running = true;
        requestAnimationFrame(frame);
      }
    });

    function stopForGood() {
      running = false;
      if (canvas) canvas.remove();
      if (control) control.remove();
      if (css) css.remove();
    }
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', function () { if (blocked()) stopForGood(); });
    if (net && net.addEventListener) net.addEventListener('change', function () { if (blocked()) stopForGood(); });

    sizeCanvas(true);
    requestAnimationFrame(frame);
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
