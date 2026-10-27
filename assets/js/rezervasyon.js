/* Rezervasyon formu — canlı sistem.
   Payload alanları ve formatı eski sürümle birebir aynıdır; backend'e dokunmadan
   değiştirilmemeli. Bkz. README "Rezervasyon formu". */
(function () {
  'use strict';
  var TURNSTILE_SITE_KEY = '0x4AAAAAADqTXiFLT_IYzDpI';
  var RESERVATION_ENDPOINT = 'https://restaurant-manager-backend.vercel.app/api/reservations/incoming';
  var PHONE = '(212) 572-7646';

  var form = document.getElementById('rezervasyon-formu');
  if (!form) return;

  // utm_* parametreleri rezervasyon talebiyle birlikte gönderilir (kaynak ölçümü).
  var utm = {};
  try {
    new URLSearchParams(window.location.search).forEach(function (val, key) {
      if (key.indexOf('utm_') === 0) utm[key] = val.slice(0, 100);
    });
  } catch (e) {}

  var widgetId = null;
  function mountTurnstile(attempt) {
    attempt = attempt || 0;
    var el = document.getElementById('ak-turnstile');
    if (!el || el.dataset.tsRendered === '1') return;
    if (!(window.turnstile && window.turnstile.render)) {
      if (attempt < 40) setTimeout(function () { mountTurnstile(attempt + 1); }, 100);
      return;
    }
    widgetId = window.turnstile.render(el, { sitekey: el.dataset.sitekey || TURNSTILE_SITE_KEY, theme: 'light' });
    el.dataset.tsRendered = '1';
  }
  mountTurnstile(0);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var token = (window.turnstile && widgetId != null) ? window.turnstile.getResponse(widgetId) : '';
    if (!token) {
      alert('Lütfen formdaki güvenlik doğrulamasını tamamlayın.');
      return;
    }
    var v = function (el) { return (el && el.value ? el.value.trim() : ''); };
    var byId = function (id) { return document.getElementById(id); };
    var dateVal = v(byId('tarih'));
    var timeVal = v(byId('saat'));
    var marketing = byId('akp-marketing');
    // Seçilen saat İstanbul saatidir (2016'dan beri yıl boyu UTC+3). Backend UTC bekliyor:
    // 19:30 -> "…T16:30:00.000Z". Eskiden '…T19:30:00.000Z' gidiyordu ve panelde 3 saat ileri görünüyordu.
    var when = (dateVal && timeVal) ? new Date(dateVal + 'T' + timeVal + ':00+03:00') : null;
    var payload = {
      customerName: v(byId('ad-soyad')),
      phone: v(byId('telefon')),
      email: v(byId('e-posta')),
      partySize: parseInt(v(byId('kisi')), 10) || 1,
      reservationTime: (when && !isNaN(when.getTime())) ? when.toISOString() : '',
      note: v(byId('not')),
      turnstileToken: token,
      marketingConsent: !!(marketing && marketing.checked),
      utm: utm
    };
    var submitBtn = form.querySelector('[type="submit"], button');
    if (submitBtn) submitBtn.disabled = true;
    var done = function () {
      if (submitBtn) submitBtn.disabled = false;
      if (window.turnstile && widgetId != null) window.turnstile.reset(widgetId);
    };
    fetch(RESERVATION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.ok) {
        alert('Rezervasyon talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.');
        form.reset();
        return;
      }
      if (res.status === 401) throw new Error('Güvenlik doğrulaması geçersiz. Lütfen tekrar deneyin.');
      if (res.status === 403) throw new Error('Rezervasyon alımı şu anda kapalı. Lütfen bizi telefonla arayın: ' + PHONE);
      if (res.status === 429) throw new Error('Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.');
      throw new Error('Talebiniz gönderilemedi. Lütfen bizi telefonla arayın: ' + PHONE);
    }).catch(function (err) {
      alert(err && err.message ? err.message : 'Talebiniz gönderilemedi. Lütfen bizi telefonla arayın: ' + PHONE);
      console.error('Rezervasyon gönderilemedi:', err);
    }).then(done);
  });
})();
