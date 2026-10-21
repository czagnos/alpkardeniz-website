# /yorum cihaz testi (yayına almadan önce)

Önce: `yorum.html` içinde `PLACE_ID` gerçek değerle dolu olmalı (`ChIJ...`). Doluysa ana butonun
linki `...&query_place_id=ChIJ...` ile biter (uzun basıp "Bağlantıyı kopyala" ile kontrol edebilirsiniz).

Test adresi: `https://alpkaradeniz.com/yorum` (QR'ı bu adrese basın; test için bu adresten
geçici bir QR da üretebilirsiniz).

Her senaryoda ana butona dokunun, sonra geri gelip yedek linke dokunun.

| # | Senaryo | Ana buton: Maps uygulaması mı, tarayıcı mı? | Doğru işletme sayfası mı? | Yedek link yorum kutusunu açtı mı? | Not |
|---|---|---|---|---|---|
| 1 | iPhone, Google Maps yüklü ve giriş yapılmış | | | | |
| 2 | iPhone, Google Maps yüklü değil | | | | |
| 3 | Android, Chrome'dan | | | | |
| 4 | QR'ı iPhone kamera uygulamasıyla okutma (Safari) | | | | |
| 5 | Linki Instagram içinden açma | | | | Sarı "Tarayıcıda aç" uyarısı görünmeli |
| 6 | Linki WhatsApp içinden açma | | | | Uygulama içi tarayıcıda açıldıysa uyarı görünmeli |

Ayrıca kontrol edin:

- [ ] Sayfa kaydırma olmadan tek ekrana sığıyor (küçük iPhone dahil).
- [ ] Normal Safari/Chrome'da sarı uyarı görünmüyor.
- [ ] "English" düğmesi metni değiştiriyor, tekrar dokununca Türkçeye dönüyor.
- [ ] Testten sonra rapor ekranında (`worker/README.md`) okutma ve tıklamalar doğru platformla görünüyor.

Beklenen: 1'de Maps uygulaması açılır. 2 ve 4'te tarayıcıda Google Maps açılabilir (bu normal).
3'te Android genelde uygulamayı açar. 5–6'da Maps açılmazsa uyarıdaki adımla tarayıcıya geçilir.

Uygulama içi tarayıcı tespiti user-agent'a bakar (Instagram, Facebook, WhatsApp, TikTok vb.).
WhatsApp bazı telefonlarda linki zaten Safari/Chrome'da açar; o durumda uyarı çıkmaması doğrudur.
Uyarı yanlış yerde çıkar ya da gerekli yerde çıkmazsa telefonun user-agent'ını not edin.
