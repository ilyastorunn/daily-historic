# North Star

## North Star Principles
- Tek odak/ekran: Her yüzey kullanıcının vermesini istediğimiz karar için optimize edilir.
- Tek accent: Ekran başına tek vurgu rengi; diğerleri yumuşak nötr tonlarda kalır.
- Editorial görsel + sakin ton: Fotoğraf ve illüstrasyonlar editoryal hissi taşır; hafif grain/vignette yalnızca odağı güçlendirmek için kullanılır.
- Cömert whitespace: Elemanlar kenarlara değmez; boşluklar nefes aldırır.
- Kısa metin: Başlık ≤60 karakter, metin ≤120 karakter ve aksiyon cümleleri tek fiil + hedef.
- Abartısız hareket: Mikro etkileşimler <250ms, ease-out; animasyonlar sadece hiyerarşiyi pekiştirir.

## Görsel Dil
- **Palet**: Yumuşak nötr zemin (sis beyazı, kum gri, hafif kömür) + ekran başına tek accent (ör. pastel zeytin, sisli mavi, kehribar ışığı). Accent yalnızca hero CTA, aktif chip veya kritik statü için kullanılır.
- **Tipografi**: Serif başlık (ör. "Cormorant Garamond") editoryal ağırlık sağlar; sans-serif gövde (ör. "Inter") okunurluğu korur. Maksimum iki ağırlık.
- **Görsel İşleme**: Hero görsellerine hafif grain ve yumuşak vignette ekleyerek odağı güçlendir; renk tonu accent ile rezonans kurar.
- **Ikonografi**: İnce çizgi, yuvarlatılmış uçlu ikonlar. Sadece anlamı güçlendirmek için.

## Yerleşim & Boşluk
- Mobil temel 8pt grid; dış margin minimum 20pt, hero bloklarda 24pt.
- Elemanlar kenarlara yapışmaz; kartlar arasında en az 16pt dikey boşluk bulunur.
- Tek sütun akışı, ikincil içerik peek/overlay ile gösterilir.

## İçerik Hiyerarşisi
1. Hero (onboarding ekranlarında mesaj, home'da "Today" kartı).
2. Spotlight/For You carousel (peek kartlar ile). 
3. Koleksiyonlar ve kategoriler.
- Kartlar: Sol üstte yıl rozeti, başlık serif, iki satır özet, aksiyonlar alt bandda.

## Metin & Ton
- Şimdi zamanı anlatan, güven veren ve net cümleler: "Discover today’s ...", "Save time".
- CTA'lar tek fiil + hedef: "Continue", "Preview", "Save".
- Yardımcı metinler 90-120 karakter; satır başına 45-60 karakter hedeflenir.

## Hareket
- Mikro etkileşimler <250ms, ease-out. Başlangıç ve bitiş hızları yumuşak.
- Carousel: hafif parallax, kart derinliği 12-16pt gölge + ölçek farkı (orta kart %100, yan kartlar %92).
- Chip seçimi: 120ms scale-up (1.05) + opacity lift, hızlı fade-out.

## Erişilebilirlik
- Kontrast AA: Gövde metin için ≥4.5:1, büyük başlıkta ≥3:1.
- Dokunma alanı min 48x48pt. Focus state: 2pt accent outline + 4pt offset.
- Dinamik tipte kart yapısı kırılmadan ölçeklenir.

## Bileşen Kuralları
- **Bottom Nav**: Geniş radius (24pt) bar; aktif item yumuşak glow (accent + blur), ikon + tercihe göre kısa label. Pasif itemler nötr metin.
- **Peek Carousel**: Orta kart büyük, yan kartlar 40% görünür. Drag hint'i için gradient overlay veya hafif offset kullanılabilir.
- **Kart**: 16pt radius, yumuşak gölge (0 12 32 rgba(0,0,0,0.12)). Üstte hero görsel veya renk bloğu; yıl rozeti küçük cap pill (accent kenarlıklı). Alt kısımda 2 satır gövde, aksiyon satırı.
- **Seçim Çipleri**: Fırınlanmış pastil form (24pt radius), dolu durumda accent fill + beyaz metin, boş durumda sis gri çizgi. Seçimde scale/fade feedback.
- **Paywall/Highlight Kartı**: Hafif gradient arka plan (ör. accent -> transparan), metin hiyerarşisi net (başlık serif, gövde sans). Tek bir birincil CTA.

## Onboarding Akışı
1. **Welcome/Hero**: Tam ekran görsel/video, kısa tagline, `Start` (primary) + `Preview Today` (ghost).
2. **Sign In**: Apple/Google/Email butonları + "Continue without sign up" linki.
3. **Categories**: Chip ızgarası; seçildiğinde dolu renk + kısa animasyon.
4. **Focus by Era**: Aynı chip sistemi; "Skip" düşük baskınlıkla kenarda.
5. **Pick a Time**: Büyük dokunulabilir kartlar (09:00, 12:00, 17:00) + "Other time" sheet tetikleyicisi.
6. **Notifications**: Minimal açıklama, 1 primary CTA, 1 ikincil link.
7. **Sample Moments**: 3 kartlık peek carousel; `Continue` CTA ile kapanır.

## Home (Landing) Yapısı
- Üstte Today’s Hero kartı (tek accent + editorial görsel).
- Altında Spotlight/For You yatay peek carousel.
- Sonrasında Collections/kategoriler listesi.
- Her blok arasında cömert boşluk; hiçbir öğe kenara yapışmaz.

## Motion Rituelleri
- Scroll sonunda bounce yok; kart geçişleri fiziksel hissiyatı düşük amortisörlü.
- Bottom nav glow aktive olurken 150ms fade + blur animasyonu.
- Onboarding chip seçiminde haptic microfeedback (hafif).

## Done Check
- Her ekranda tek odak ve tek accent korunur.
- Carousel, nav, chip davranışları yukarıdaki kurallara uyar.
- Onboarding metinleri kısa ve tutarlı; flow eksiksiz.
- Home: Hero + peek carouseller + listeler net hiyerarşi sunar.
- Okunabilirlik/kontrast AA barajını geçer.
