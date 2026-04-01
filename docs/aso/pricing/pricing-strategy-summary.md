# Historiq — Fiyatlandırma Strateji Özeti

**Uygulama:** Historiq - History Daily (`com.ilyastorun.histora`)
**Hazırlanma Tarihi:** 2026-03-30
**Kaynak Belgeler:**
- `competitor-pricing-analysis.md` — 28 rakip uygulama analizi (iTunes API, 2026-03-30)
- `ppp-pricing-strategy.md` — 26 pazar PPP fiyatlandırma planı

---

## Karar: Önerilen Monetizasyon Modeli

**Freemium + Abonelik**

Zorunlu abonelik veya ücretli indirme modeli bu kategoride çalışmıyor (History Daily: zorunlu abonelik → 0 yorum). Cömert ücretsiz tier + premium abonelik en yüksek etkileşim ve geliri üretiyor (Facts: 63K yorum, 4.8 puan).

---

## Fiyat Noktaları (USD Baz)

| Ürün | Fiyat | Gerekçe |
|------|-------|---------|
| Aylık | **$3.99/ay** | Rakip tatlı noktası; $1.99 "destek" tierının üstü, $7.99 "içerik platformu" tierının altı |
| Yıllık | **$19.99/yıl** (~$1.67/ay) | Aylık fiyata göre %58 indirim; Factorium (4.7 puan) tarafından doğrulanmış |
| Lifetime | **$49.99** (lansman sonrası 6+ ay) | Facts ($99.99)'ın altı; LTV verileri toplandıktan sonra devreye alınacak |

---

## Ücretsiz / Premium Tier Sınırı

### Ücretsiz Tier
- Günlük 3-5 küratörlü tarihi olay
- Time Machine (son 3 yıl sınırlı)
- Temel arama (günlük 5 arama limiti)
- Olay kaydetme (max 20)
- Kategori / dönem tercihleri
- Günlük bildirimler

### Premium ("Historiq Pro")
- Sınırsız Time Machine (tüm yıllar)
- Sınırsız arama ve Explore
- Sınırsız kayıt ve koleksiyonlar
- Deep Dive — AI destekli derinlemesine analiz
- Kişiselleştirilmiş günlük bülten
- Widget desteği (ana ekran + kilit ekranı)
- Tema ve görsel özelleştirme
- Reklamsız deneyim

> **Rakip boşluğu:** "AI" ve "kişiselleştirme" kategoride neredeyse hiç kullanılmıyor. "Time Machine" terimi hiç yok. Bunlar hem ASO'da hem premium gerekçesinde ana farklılaştırıcı olacak.

---

## Ülke Bazlı Fiyatlandırma (Özet)

Tam tablo: `ppp-pricing-strategy.md`

### Tier 1 — Gelişmiş Pazarlar (0-15% indirim)
| Pazar | Aylık | Yıllık |
|-------|-------|--------|
| 🇺🇸 US | $3.99 | $19.99 |
| 🇬🇧 UK | £3.49 (~$4.40) | £17.99 (~$22.70) |
| 🇩🇪 DE | €3.99 | €19.99 |
| 🇫🇷 FR | €3.99 | €19.99 |
| 🇳🇱 NL | €3.99 | €19.99 |
| 🇸🇪 SE | 44 SEK (~$4.05) | 219 SEK (~$20.20) |
| 🇦🇺 AU | A$5.99 (~$3.75) | A$29.99 (~$18.80) |
| 🇨🇦 CA | C$4.99 (~$3.50) | C$24.99 (~$17.55) |
| 🇯🇵 JP | ¥600 (~$4.00) | ¥2,900 (~$19.30) |
| 🇰🇷 KR | ₩5,500 (~$4.00) | ₩27,000 (~$19.60) |
| 🇦🇪 UAE | AED 14.99 (~$4.08) | AED 73.99 (~$20.15) |
| 🇸🇦 SA | SAR 14.99 (~$3.99) | SAR 74.99 (~$19.99) |

### Tier 2 — Üst-Orta Pazarlar (40-66% indirim)
| Pazar | Aylık | Yıllık |
|-------|-------|--------|
| 🇵🇱 PL | zł 6.99 (~$1.72) | zł 34.99 (~$8.60) |
| 🇲🇽 MX | MX$39 (~$2.00) | MX$199 (~$10.20) |
| 🇧🇷 BR | R$12.90 (~$2.50) | R$64.90 (~$12.55) |
| 🇹🇭 TH | ฿59 (~$1.73) | ฿299 (~$8.75) |
| 🇿🇦 ZA | R34.99 (~$1.90) | R169.99 (~$9.30) |

### 🇹🇷 Türkiye — Özel Değerlendirme
| Ürün | Fiyat (TRY) | USD Karşılığı |
|------|-------------|----------------|
| Aylık | ₺29.99 | ~$0.83 |
| Yıllık | ₺149.99 | ~$4.15 |

> **Not:** TRY'nin yüksek enflasyon ve kur oynaklığı nedeniyle Apple, Türkiye fiyatlarını periyodik olarak otomatik günceller. Çeyreklik manuel kontrol gereklidir.

### Tier 3 — Gelişen Pazarlar (71-92% indirim)
| Pazar | Aylık | Yıllık |
|-------|-------|--------|
| 🇮🇳 IN | ₹79 (~$0.94) | ₹399 (~$4.75) |
| 🇮🇩 ID | Rp 15,000 (~$0.95) | Rp 75,000 (~$4.73) |
| 🇵🇭 PH | ₱59 (~$1.04) | ₱299 (~$5.25) |
| 🇵🇰 PK | Rs 199 (~$0.70) | Rs 999 (~$3.50) |
| 🇳🇬 NG | ₦499 (~$0.33) | ₦2,499 (~$1.65) |

---

## Uygulama Yol Haritası

### Faz 1 — Lansman (Mayıs 2026)
Fiyatlandırma yapılandırmadan önce tamamlanması gerekenler:

1. **ASC'de Abonelik Grubu Oluştur**
   - Grup: "Historiq Pro"
   - Ürün ID'leri:
     - `com.ilyastorun.histora.pro.monthly`
     - `com.ilyastorun.histora.pro.annual`

2. **StoreKit Entegrasyonu**
   - RevenueCat SDK kurulumu (`npm install react-native-purchases`)
   - `isPremium` field'ını `UserProfile` tipine ekle
   - Paywall modal geliştirme

3. **Başlangıç Pazarları (6 pazar)**
   US, UK, DE, AU, CA, TR — en yüksek indirme potansiyeli

### Faz 2 — Genişleme (Temmuz 2026)
FR, NL, SE, IT, ES, JP, KR, UAE, SA

### Faz 3 — Gelişen Pazarlar (Eylül 2026)
BR, MX, PL, IN, ID, TH, ZA, PH, PK, NG

### Faz 4 — Lifetime Seçeneği (Kasım 2026+)
LTV verileri (6 ay) toplandıktan sonra $49.99 lifetime seçeneği ekle.

---

## CSV İmport (Faz 1 + 2 — Aylık Abonelik)

```csv
territory,price,start_date
USA,3.99,2026-05-20
GBR,3.49,2026-05-20
DEU,3.99,2026-05-20
FRA,3.99,2026-05-20
NLD,3.99,2026-05-20
SWE,44.00,2026-05-20
AUS,5.99,2026-05-20
CAN,4.99,2026-05-20
TUR,29.99,2026-05-20
JPN,600.00,2026-07-01
KOR,5500.00,2026-07-01
ITA,3.99,2026-07-01
ESP,3.99,2026-07-01
ARE,14.99,2026-07-01
SAU,14.99,2026-07-01
BRA,12.90,2026-09-01
MEX,39.00,2026-09-01
POL,6.99,2026-09-01
IND,79.00,2026-09-01
IDN,15000.00,2026-09-01
THA,59.00,2026-09-01
ZAF,34.99,2026-09-01
PHL,59.00,2026-09-01
PAK,199.00,2026-09-01
NGA,499.00,2026-09-01
```

Kullanım: `asc subscriptions pricing prices import --subscription-id SUB_ID --input ppp-monthly.csv --dry-run`

---

## Gelir Tahminleri

| Senaryo | Yıl 1 MAU | Dönüşüm | Yıllık Gelir |
|---------|-----------|---------|--------------|
| Muhafazakâr | 5,000 | %3 | ~$4,500 |
| Orta | 15,000 | %5 | ~$25,200 |
| İyimser | 50,000 | %7 | ~$126,000 |

> PPP fiyatlandırması uygulandığında gelişen pazarlardan +%39 fazla ödeyen kullanıcı ve USD bazında +%5.7 gelir artışı bekleniyor (flat USD fiyatlamaya kıyasla).

---

## Öncelikli Aksiyonlar

| # | Aksiyon | Kimin | Hedef Tarih |
|---|---------|-------|-------------|
| 1 | RevenueCat SDK entegrasyonu | Geliştirme | Nisan 2026 |
| 2 | StoreKit konfigürasyon dosyası oluştur | Geliştirme | Nisan 2026 |
| 3 | ASC'de abonelik grubu ve ürünler oluştur | Yönetici | Mayıs 2026 |
| 4 | Paywall UI geliştir (TimeMachine + DeepDive) | Geliştirme | Mayıs 2026 |
| 5 | Faz 1 ülkeler için fiyatları CSV ile import et | Yönetici | Lansman günü |
| 6 | 3 aylık ücretsiz deneme aktifleştir | ASC | Lansman günü |
| 7 | Faz 2 ülkeleri ekle | Yönetici | Temmuz 2026 |
| 8 | TRY kur kontrolü | Yönetici | Her çeyrek |
| 9 | Lifetime seçeneği değerlendirmesi | Strateji | Kasım 2026 |
