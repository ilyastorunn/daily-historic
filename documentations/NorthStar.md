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
  - **Dark Mode Renk Stratejisi**: Dark mode'da accent renkleri daha açık ve soft yapılır (ör. #708C77 → #9bbb92) böylece karanlık zeminde (#24201a) gözü yormaz. Aynı hue korunur, sadece lightness/saturation ayarlanır. Kontrast oranı AA standardını korur (≥4.5:1 for text). Kullanıcı light ↔ dark geçişinde markayı tanır.
  - **Tema Tercihi**: Kullanıcı light, dark veya system (cihazı takip et) seçebilir. Default: system.
- **Tipografi**: Serif başlık (ör. "Cormorant Garamond") editoryal ağırlık sağlar; sans-serif gövde (ör. "Inter") okunurluğu korur. Maksimum iki ağırlık.
- **Görsel İşleme**: Hero görsellerine hafif grain ve yumuşak vignette ekleyerek odağı güçlendir; renk tonu accent ile rezonans kurar.
- **Ikonografi**: İnce çizgi, yuvarlatılmış uçlu ikonlar. Sadece anlamı güçlendirmek için.

## Yerleşim & Boşluk
- Mobil temel 8pt grid; dış margin minimum 20pt, hero bloklarda 24pt.
- Elemanlar kenarlara yapışmaz; kartlar arasında en az 16pt dikey boşluk bulunur.
- Tek sütun akışı, ikincil içerik peek/overlay ile gösterilir.

## Tasarım Tokenları (Home Ekleri)
- **Radius**: r-sm=12 (çipler ve mini kartlar), r-md=16 (kartlar, koleksiyon tile'ları), r-lg=20 (Time Machine blokları gibi büyük yüzeyler).
- **Elevasyon**: e-1 hafif hover/pressed durumları; e-2 koleksiyon tile'ları ve Time Machine bloğu için kalıcı yükselti.
- **Spacing**: s-4=16, s-5=20, s-6=24 — Home modülleri arası boşluk ve blok iç padding'leri için rehber.
- **Motion süreleri**: dur-fast=120ms, dur-base=220ms — mikro etkileşimler <250ms sınırı içinde tutulur.
- **Yüzeyler**: surface/raised (karo ve premium blok), surface/hero (görsel overlay); ekranda tek accent kuralı korunur.

## İçerik Hiyerarşisi
1. Hero Carousel (Today’s Moment kartları; 5 elemanlık snap carousel).
2. Weekly Collections grid (2×2 editoryal blok + “See all”).
3. Time Machine premium bloğu.
4. Compact Category Chip rail + opsiyonel “Related now” şeridi.
- Hero kart anatomisi değişmez: sol üstte yıl rozeti, serif başlık, iki satır özet, aksiyonlar alt bantta.

## Metin & Ton
- Şimdi zamanı anlatan, güven veren ve net cümleler: "Discover today’s ...", "Save time".
- CTA'lar tek fiil + hedef: "Continue", "Preview", "Save".
- Yardımcı metinler 90-120 karakter; satır başına 45-60 karakter hedeflenir.

## Hareket
- Mikro etkileşimler <250ms, ease-out; dur-fast=120ms, dur-base=220ms pencere içinde kal.
- Hero carousel: hafif parallax, kart derinliği 12-16pt gölge + ölçek farkı (orta kart %100, yan kartlar %92); snap animasyonu 200ms’den uzun olmaz.
- Koleksiyon tile basış: 120ms scale 0.98 + gölge e-1’e iner, ardından yaylı geri dönüş.
- Time Machine bloğu: 120ms basış ölçeği + hafif kararma, girişte 220ms fade/raise.
- Chip seçimi: 120ms scale-up (1.05) + opacity lift, opsiyonel hafif haptic.

## Erişilebilirlik
- Kontrast AA: Gövde metin için ≥4.5:1, büyük başlıkta ≥3:1.
- Dokunma alanı min 48x48pt. Focus state: 2pt accent outline + 4pt offset.
- Dinamik tipte kart yapısı kırılmadan ölçeklenir.

## Bileşen Kuralları
- **HeroCarousel**: Mevcut hero kart anatomisini kullanır; carousel peek derinliği %92, dış margin ≥20pt, kart arası ≥16pt. Parallax kontrollü, indicator fraksiyon veya pip. Props `HeroCarouselProps` (items, onOpen, initialIndex).
- **CollectionsGrid (2×2)**: Dört eşit tile, r-md radius, e-2 shadow. Görsel üstünde serif başlık (1 satır). `See all` ghost CTA header hizasında. Basışta 0.98 scale + e-1. Props `CollectionsGridProps` (items, onOpen, onSeeAll).
- **CollectionDetail**: Kapak görseli + başlık, gövde düşey kart listesi veya yatay pager. Swipe ile alt kümeler arası geçiş desteklenebilir. Props `CollectionDetailProps`.
- **TimeMachineBlock**: r-lg radius, e-2, sabit illüstrasyon. Premium değilse kilit rozeti + paywall tetikleyici; premiumda direkt flow. Basışta tüm blok 0.98 scale. Props `TimeMachineBlockProps`.
- **CategoryChipRail (Compact)**: 28–32pt yükseklik, outline varsayılan, accent sadece seçili chipte. Rail padding s-5, üstünde ince ayraç çizgi. Uzun basış pin kontrolü, props `CategoryChipRailProps`.
- **Related Now strip**: Chip seçildikten sonra açılan 2-3 küçük kart; kartlar r-sm, hafif e-1 shadow, hero ile tekrar içeriği çakışmaz.
- **Bottom Nav**: Geniş radius (24pt) bar; aktif item yumuşak glow (accent + blur), ikon + tercihe göre kısa label. Pasif itemler nötr metin.
- **Genel Kart**: 16pt radius, 0 12 32 rgba(0,0,0,0.12) gölge. Yıl rozeti küçük cap pill (accent kenarlıklı). Alt kısım iki satır gövde + aksiyon satırı.

## Onboarding Akışı
1. **Welcome/Hero**: Tam ekran görsel/video, kısa tagline, `Start` (primary) + `Preview Today` (ghost).
2. **Sign In**: Apple/Google/Email butonları + "Continue without sign up" linki.
3. **Categories**: Chip ızgarası; seçildiğinde dolu renk + kısa animasyon.
4. **Focus by Era**: Aynı chip sistemi; "Skip" düşük baskınlıkla kenarda.
5. **Pick a Time**: Büyük dokunulabilir kartlar (09:00, 12:00, 17:00) + "Other time" sheet tetikleyicisi.
6. **Notifications**: Minimal açıklama, 1 primary CTA, 1 ikincil link.
7. **Sample Moments**: 3 kartlık peek carousel; `Continue` CTA ile kapanır.

## Home (Landing) Yapısı
- Hero carousel (Today’s Moment) ilk blok; tek accent burada veya premium CTA’da kullanılır.
- Ardından Weekly Collections 2×2 grid + “See all”.
- Sonrasında Time Machine premium bloğu (sabit illüstrasyon).
- En altta Compact Category Chip rail + chip seçildiğinde “Related now” şeridi.
- Her blok arasında ≥20pt boşluk; yüzeyler kenara yapışmaz.

## Motion Rituelleri
- Scroll sonunda bounce yok; kart geçişleri düşük amortisörlü.
- Hero carousel swipe’ı haptic feedback üretmez; sadece snap sesi/hissi.
- Koleksiyon tile ve Time Machine basışlarında hafif impact haptic.
- Bottom nav glow aktive olurken 150ms fade + blur animasyonu.
- Chip seçiminde hafif (selection) haptic + 120ms scale animasyonu.

## Profile & Preferences
- **Appearance**: 3 chip (Light, Dark, System) - default System. SelectableChip kullanır; accent seçili olanda.
- **Notifications**: Daily email digest toggle (Switch). Helper text altında açıklama.
- **Content Preferences**: Categories ve Eras chip grupları (ileride collapsible).
- **Workflow**: Appearance seçimi → Firestore'a `themePreference` yazılır → ThemeContext güncellenir → App re-render.
- **Analytics**: `theme_changed` event (from, to parametreleri ile).

## Done Check
- Her ekranda tek odak ve tek accent korunur.
- Hero carousel, Collections grid, Time Machine blok ve Chip rail yukarıdaki token/motion kurallarını takip eder.
- Onboarding metinleri kısa ve tutarlı; flow eksiksiz.
- Home: blok sırası (Hero → Collections → Time Machine → Chip rail) korunur, boşluklar ≥20pt.
- Okunabilirlik/kontrast AA barajını geçer; hit alanları ≥48×48pt.
