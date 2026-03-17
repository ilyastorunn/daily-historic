# Backend Hardening Tracker

Bu dosya, bu branch'te yaptigimiz guvenlik, auth ve veri dayanikliligi iyilestirmelerini kisa notlarla takip etmek icin tutulur.
Amac: is bittiginde alttaki test ve kotu senaryolari tek tek uygulayip sonucu isaretlemek.

## Bu Branch'te Yapilanlar

### 1. Explore arama tarafina hafif koruma eklendi
- Arama artik 2 karakterden once ag istegi atmiyor.
- Ayni anda birden fazla arama istegi birikmesin diye onceki istek iptal ediliyor.
- Ayni arama kombinasyonu kisa sure icin bellekten donuyor; gereksiz tekrar istek azaltiliyor.
- Hedef: normal kullanicinin hizli yazmasi veya filtrelerle oynamasi durumunda Algolia yukunu azaltmak.

### 2. Saved verisi tek user dokumanindan cikarildi
- Yeni kaydetmeler artik `Users/{uid}/savedEvents/{eventId}` alt koleksiyonuna yaziliyor.
- Hedef: tek dokumanin sisip Firestore limitine vurmasini engellemek.
- Hedef: cok fazla saved event olan kullanicilarda veri yapisini daha saglikli buyutmek.

### 3. Eski saved verileri icin gecis uyumlulugu eklendi
- Kullanicide eski `savedEventIds` listesi varsa uygulama bunlari yeni alt koleksiyon yapisina tasimaya calisiyor.
- Eski yapi tamamen bir anda kirilmiyor; gecis kademeli yapiliyor.

### 4. Home ekranindaki gereksiz tekrar okumalar azaltildi
- Profilde alakasiz bir alan degistiginde tum saved event'ler tekrar tekrar cekilmesin diye tetikleme daha stabil hale getirildi.
- Home, tum gecmisi degil, anlamli bir ust sinir ile son saved story'leri yukluyor.
- Hedef: gorunmez Firestore okuma maliyetini dusurmek.

## Henuz Bu Branch'te Bitmeyen / Sonra Ele Alinacaklar

### 1. Gercek auth baglantisi
- Email/password gercekten eklenecek mi yoksa sadece Apple/Google/anonymous ile mi gidilecek karari netlestirilecek.
- Eger email auth eklenecekse anonim kullanicinin hesap upgrade akisi da tasarlanacak.
- Gercek auth'a bagli olmayan placeholder Apple/Google/Email onboarding secenekleri guvenli hale getirilecek veya kaldirilacak.

### 2. Eski explore backend kapisi
- Deploy'da acik kalmis eski search endpoint'i var mi kontrol edilecek.
- Gerekirse kapatilacak veya auth / App Check / rate limit ile korunacak.
- 2026-03-17 incelemesinde prod'da `api` HTTP function'inin aktif oldugu dogrulandi.
- Canli probe sonucu eski route disaridan 200 donuyor: `/api/explore/search?limit=1`

### 3. User dokumani icin ek sertlestirme
- Rules tarafinda sadece tip degil alan siniri, izinli alan listesi ve buyukluk stratejisi daha da sertlestirilecek.
- Liked ve reactions icin de gerekirse alt koleksiyon modeli dusunulecek.

## Test ve Kotu Senaryolar

- [ ] Explore ekraninda 1 karakter, 2 karakter ve 3 karakter arama davranisini kontrol et.
- [ ] Ayni sorguyu hizli hizli tekrar yazarak gereksiz tekrar ag istekleri var mi izle.
- [ ] Filtreleri hizli ac-kapa yapip uygulama stabil kaliyor mu kontrol et.
- [ ] Arama sirasinda onceki istek iptal oldugunda UI hata veriyor mu kontrol et.

- [ ] Yeni bir kullanici ile event save et; kayit user dokumani yerine `savedEvents` alt koleksiyonuna yaziliyor mu kontrol et.
- [ ] Eski `savedEventIds` verisi olan bir kullanici ile acilis yap; migration calisiyor mu kontrol et.
- [ ] Migration sonrasi eski save'ler gorunuyor mu kontrol et.
- [ ] Migration sonrasi ayni event iki kez gorunuyor mu kontrol et.

- [ ] 10, 100, 500, 1000 saved event icin Home performansini kontrol et.
- [ ] Profilde tema/notification gibi alakasiz alanlari degistir; Home tum saved event'leri yeniden cekiyor mu kontrol et.
- [ ] Saved listesinden bir event kaldir; UI ve veri birlikte duzgun guncelleniyor mu kontrol et.

- [ ] Guest mode ile onboarding tamamla; kullaniciya yaniltici auth mesaji kalmis mi kontrol et.
- [ ] Placeholder Apple/Google/Email secenekleri guvenli hale getirildikten sonra kullaniciyi yaniltmiyor mu kontrol et.
- [ ] Profil ekraninda account label beklenen sekilde guest session olarak kaliyor mu kontrol et.

- [ ] Kotu senaryo: kullanici cok kisa surede yuzlerce save/unsave yaparsa veri tutarsizligi oluyor mu kontrol et.
- [ ] Kotu senaryo: ayni anda iki cihazdan ayni event save/unsave yapilirsa son durum dogru mu kontrol et.
- [ ] Kotu senaryo: internet kesik / zayifken save yapildiginda UI ve senkron davranisi dogru mu kontrol et.
- [ ] Kotu senaryo: saved migration yarida kesilirse uygulama acilmaya devam ediyor mu kontrol et.
- [ ] Kotu senaryo: cok buyuk legacy saved listesi olan kullanicida acilis suresi kabul edilebilir mi kontrol et.

- [ ] Guvenlik sonrasi: deploy'da eski explore search endpoint'i acik mi kontrol et.
- [ ] Guvenlik sonrasi: sadece sahibinin kendi `savedEvents` kaydini okuyup yazabildigini dogrula.
- [ ] Guvenlik sonrasi: manipule edilmis client ile saved alt koleksiyonuna bozuk payload yazilabiliyor mu dene.
