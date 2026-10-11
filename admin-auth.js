/* Khóa đăng nhập quản trị (dùng chung auth.html và admin.html).
   - Phiên đăng nhập CHỈ nằm trong sessionStorage của tab hiện tại (đóng tab/trình duyệt là mất),
     không dùng localStorage, nên máy từng vào không giữ lại gì. Trang quản trị còn tự xóa khi rời trang,
     tải lại trang, hoặc để quá lâu không thao tác.
   - Không chứa khóa bí mật: chỉ dùng khóa công khai (anon) như các trang khác. */
(function () {
  var CFG = (window.SITE && window.SITE.supabase) || {};
  var KEY = 'nca-admin-auth';
  var mem = {};
  var store = {
    getItem: function (k) { try { var v = window.sessionStorage.getItem(k); return v === null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } },
    setItem: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    removeItem: function (k) { try { window.sessionStorage.removeItem(k); } catch (e) {} delete mem[k]; }
  };
  window.NCA_adminClient = function () {
    return window.supabase.createClient(CFG.url, CFG.anonKey, {
      auth: { storage: store, storageKey: KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
  };
  // Xóa sạch phiên trên máy này (đồng bộ) và báo máy chủ hủy phiên (cố gắng, không chờ)
  window.NCA_adminWipe = function (tellServer) {
    var tok = null;
    try { var raw = store.getItem(KEY); if (raw) tok = (JSON.parse(raw) || {}).access_token; } catch (e) {}
    store.removeItem(KEY);
    try { Object.keys(window.sessionStorage).forEach(function (k) { if (k.indexOf('sb-') === 0 || k === KEY) window.sessionStorage.removeItem(k); }); } catch (e) {}
    if (tellServer && tok && window.fetch) {
      try {
        var h = { apikey: CFG.anonKey, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' };
        window.fetch(CFG.url + '/rest/v1/rpc/admin_end_session', { method: 'POST', headers: h, body: '{}', keepalive: true }).catch(function () {});
        window.fetch(CFG.url + '/auth/v1/logout?scope=global', { method: 'POST', headers: h, keepalive: true }).catch(function () {});
      } catch (e) {}
    }
  };
})();
