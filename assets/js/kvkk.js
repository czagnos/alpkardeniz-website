/* KVKK Aydınlatma / Açık Rıza penceresi (yalnızca rezervasyon sayfasında yüklenir).
   Metinler kök dizindeki kvkk-*.md sayfalarıyla aynı içeriktedir. JS yoksa
   [data-kvkk-open] linkleri doğrudan bu sayfalara gider. */
(function(){
  "use strict";

  var AYDINLATMA = `
    <h1>Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni</h1>
    <div class="akp-note">Alp Karadeniz Pidecisi (Yedi Bölge İletişim Sistemleri İnşaat İthalat İhracat Sanayi Ticaret Ltd. Şti.) tarafından, 6698 sayılı KVKK kapsamında hazırlanmıştır.</div>
    <h2>Veri Sorumlusu</h2>
    <ul>
      <li><strong>Ticari unvan:</strong> Yedi Bölge İletişim Sistemleri İnşaat İthalat İhracat Sanayi Ticaret Ltd. Şti.</li>
      <li><strong>Adres:</strong> Cevizlik Mah. Hüsreviye Sok. No:34/A Bakırköy / İstanbul</li>
      <li><strong>E-posta:</strong> <a href="mailto:info@alpkaradeniz.com">info@alpkaradeniz.com</a></li>
      <li><strong>Telefon:</strong> +90 212 572 76 46</li>
    </ul>
    <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan kapsamda işliyoruz.</p>
    <h2>İşlenen Kişisel Veriler</h2>
    <ul><li>Ad-soyad</li><li>Telefon numarası</li><li>E-posta adresi</li><li>Teslimat adresi</li><li>Sipariş ve rezervasyon bilgileri</li></ul>
    <h2>İşleme Amaçları</h2>
    <ul>
      <li>Sipariş ve rezervasyonların alınması ve yönetimi</li>
      <li>Teslimat süreçlerinin yürütülmesi</li>
      <li>Müşteri ilişkileri ve talep/şikâyet yönetimi</li>
      <li>Yasal yükümlülüklerin yerine getirilmesi</li>
      <li>Açık rıza vermeniz hâlinde kampanya ve duyuruların iletilmesi</li>
    </ul>
    <h2>Hukuki Sebepler</h2>
    <ul>
      <li>Sözleşmenin kurulması/ifası (KVKK m.5/2-c)</li>
      <li>Hukuki yükümlülüğün yerine getirilmesi (KVKK m.5/2-ç)</li>
      <li>Meşru menfaat (KVKK m.5/2-f)</li>
      <li>Açık rıza gereken hâllerde açık rızanız</li>
    </ul>
    <h2>Aktarım</h2>
    <p>Verileriniz, hizmetin sağlanması amacıyla aşağıdaki taraflarla paylaşılabilir:</p>
    <ul>
      <li>Bilişim/sunucu (barındırma) hizmet sağlayıcısı: Vercel Inc.</li>
      <li>Veri tabanı hizmet sağlayıcısı: MongoDB</li>
    </ul>
    <p>Teslimat süreçleri kendi kuryelerimizce yürütülmekte olup verileriniz bu amaç dışında üçüncü kişilere aktarılmaz. İşletmemizde online ödeme alınmamaktadır.</p>
    <p><strong>Yurt dışına aktarım:</strong> Bilişim altyapımız (Vercel ve MongoDB) yurt dışında barındırıldığından, rezervasyon ve sipariş verileriniz KVKK m.9 kapsamında uygun güvenceler ile yurt dışına aktarılmaktadır.</p>
    <h2>Saklama Süresi</h2>
    <p>Kişisel verileriniz, ilgili mevzuatta öngörülen süreler ve işleme amacının gerektirdiği süre boyunca saklanır; sürenin sonunda silinir, yok edilir veya anonim hâle getirilir.</p>
    <h2>Haklarınız (KVKK m.11)</h2>
    <p>Kişisel verilerinize ilişkin olarak işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, işlemeye itiraz etme, aktarıldığı üçüncü kişileri öğrenme ve KVKK m.11&rsquo;de sayılan diğer haklarınızı <a href="mailto:info@alpkaradeniz.com">info@alpkaradeniz.com</a> adresi üzerinden kullanabilirsiniz.</p>
    <p class="akp-fineprint">Bu metin bir başlangıç taslağıdır; nihai hâli için bir KVKK danışmanına/avukata danışmanız önerilir.</p>
  `;

  var RIZA = `
    <h1>Açık Rıza Beyanı</h1>
    <div class="akp-note">Bu rıza yalnızca pazarlama/ticari elektronik ileti içindir ve rezervasyon hizmetinden yararlanmanın ön koşulu değildir.</div>
    <p>Alp Karadeniz Pidecisi (Yedi Bölge İletişim Sistemleri İnşaat İthalat İhracat Sanayi Ticaret Ltd. Şti.) tarafından; kampanya, promosyon, indirim ve duyuruların tarafıma <strong>SMS / e-posta / arama</strong> yoluyla iletilmesi (ticari elektronik ileti) amacıyla iletişim bilgilerimin işlenmesine, rezervasyon formundaki ilgili kutuyu işaretleyerek <strong>açık rıza vermiş olurum.</strong></p>
    <p>Bu rızam, hizmetten yararlanmamın ön koşulu değildir ve dilediğim zaman <a href="mailto:info@alpkaradeniz.com">info@alpkaradeniz.com</a> üzerinden geri çekebilirim.</p>
    <h2>Önemli</h2>
    <ul>
      <li>Pazarlama izni kutusu önceden işaretli değildir; işaretlemek tamamen sizin tercihinizdir.</li>
      <li>Rıza vermeseniz de rezervasyon talebinizi gönderebilirsiniz.</li>
      <li>Verdiğiniz rızayı istediğiniz zaman geri çekebilirsiniz.</li>
    </ul>
    <p class="akp-fineprint">Bu metin bir başlangıç taslağıdır; nihai hâli için bir KVKK danışmanına/avukata danışmanız önerilir.</p>
  `;

  function el(tag, cls, html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }

  function ensureModal(){
    var ov=document.getElementById("akp-kvkk-overlay");
    if(ov) return ov;
    ov=el("div","akp-kvkk-overlay"); ov.id="akp-kvkk-overlay"; ov.setAttribute("aria-hidden","true");
    ov.innerHTML='<div class="akp-kvkk-modal" role="dialog" aria-modal="true" aria-label="KVKK Metinleri">'
      +'<div class="akp-kvkk-tabs"><button type="button" data-tab="aydinlatma" class="akp-active">Aydınlatma Metni</button><button type="button" data-tab="riza">Açık Rıza Beyanı</button><button type="button" class="akp-kvkk-x" aria-label="Kapat">&times;</button></div>'
      +'<div class="akp-kvkk-body"><div data-panel="aydinlatma">'+AYDINLATMA+'</div><div data-panel="riza" hidden>'+RIZA+'</div></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function(e){
      if(e.target===ov || e.target.classList.contains("akp-kvkk-x")){ return closeModal(); }
      var tab=e.target.closest("[data-tab]"); if(tab) openModal(tab.getAttribute("data-tab"));
    });
    return ov;
  }

  function openModal(which){
    var ov=ensureModal();
    which=(which==="riza")?"riza":"aydinlatma";
    ov.querySelectorAll("[data-panel]").forEach(function(p){ p.hidden = p.getAttribute("data-panel")!==which; });
    ov.querySelectorAll("[data-tab]").forEach(function(b){ b.classList.toggle("akp-active", b.getAttribute("data-tab")===which); });
    ov.querySelector(".akp-kvkk-body").scrollTop=0;
    ov.classList.add("akp-open"); ov.setAttribute("aria-hidden","false");
    document.documentElement.style.overflow="hidden";
    var x=ov.querySelector(".akp-kvkk-x"); if(x) x.focus();
  }
  function closeModal(){
    var ov=document.getElementById("akp-kvkk-overlay"); if(ov){ ov.classList.remove("akp-open"); ov.setAttribute("aria-hidden","true"); }
    document.documentElement.style.overflow="";
  }

  document.addEventListener("click", function(e){
    var t=e.target.closest("[data-kvkk-open]");
    if(t){ e.preventDefault(); openModal(t.getAttribute("data-kvkk-open")); }
  });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape") closeModal(); });
})();
