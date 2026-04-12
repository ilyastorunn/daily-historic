# A/B Test Fiyatlandırma: Weekly + Yearly — Historiq Pro

**Hazırlanma Tarihi:** 2026-04-11
**Bağlam:** Mevcut "Historiq Pro" grubundaki Monthly ($3.99) + Yearly ($19.99) planlarına alternatif olarak yeni bir subscription group için A/B test fiyatlandırması.
**Kaynak:** `price-list.md` ve `competitor-pricing-analysis.md` verileri baz alınarak PPP hesaplaması yapılmıştır.

---

## Strateji Özeti

### Mevcut Planlar (Grup 1 — Canlı)
| Plan | USD |
|------|-----|
| Monthly | $3.99/ay |
| Yearly | $19.99/yıl (~$1.67/ay) |

### A/B Test Planları (Grup 2 — Yeni)
| Plan | USD | Gerekçe |
|------|-----|---------|
| **Weekly** | **$1.49/hafta** (~$6.45/ay) | Düşük taahhüt, yüksek birim fiyat; yıllık plana yönlendirme baskısı oluşturur |
| **Yearly** | **$24.99/yıl** (~$2.08/ay) | Mevcut $19.99'dan %25 yüksek; rakip Paladin ($29.99/yr) altında, hâlâ cazip |

### Neden Bu Fiyatlar?

**Weekly $1.49:**
- Kategoride tek weekly referans: Factorium $1.99/wk. Bizim $1.49 daha erişilebilir.
- History Daily: On This Day uygulaması $4.99/wk kullanıyor — bu çok agresif (0 yorum).
- $1.49/wk = ~$6.45/mo eşdeğeri → kullanıcıyı yearly plana yönlendirir ($24.99/yr = %68 tasarruf vs weekly)
- Haftalık fiyat psikolojisi: "Haftada bir kahve fiyatına tarih" mesajı işe yarar.

**Yearly $24.99:**
- Mevcut $19.99'dan %25 yüksek (A/B test amacıyla makul bir yükseltme).
- Paladin ($29.99/yr, 14K yorum) altında kalıyor — premium ama erişilebilir.
- Monthly plana göre hâlâ %48 indirim ($24.99 vs $3.99×12=$47.88).
- Weekly plana göre %68 tasarruf ($24.99 vs $1.49×52=$77.48) → güçlü value prop.

---

## Paywall Mesajlaşması Önerisi (A/B Test Grubu)

```
Weekly    $1.49/hafta   Dene, istersen bırak
Yearly    $24.99/yıl   En popüler · Haftaya yalnızca $0.48
```

---

## Tam Ülke Fiyat Tablosu

> **Hesaplama Metodolojisi:**
> - Weekly = `territory_monthly × (1.49 / 3.99)` → en yakın Apple fiyat noktasına yuvarlandı
> - Yearly_new = `territory_yearly × (24.99 / 19.99)` → en yakın Apple fiyat noktasına yuvarlandı

| # | Ülke | Para | Mevcut Aylık | Mevcut Yıllık | **A/B Weekly** | **A/B Yearly** |
|---|------|------|-------------|--------------|----------------|----------------|
| 1 | ABD | USD | $3.99 | $19.99 | **$1.49** | **$24.99** |
| 2 | İngiltere | GBP | £2.99 | £14.99 | **£0.99** | **£18.99** |
| 3 | Almanya | EUR | €3.49 | €17.99 | **€1.29** | **€22.99** |
| 4 | Fransa | EUR | €3.49 | €17.99 | **€1.29** | **€22.99** |
| 5 | Hollanda | EUR | €3.49 | €17.99 | **€1.29** | **€22.99** |
| 6 | İtalya | EUR | €3.49 | €17.99 | **€1.29** | **€22.99** |
| 7 | İspanya | EUR | €2.99 | €14.99 | **€0.99** | **€18.99** |
| 8 | Finlandiya | EUR | €3.29 | €16.99 | **€1.19** | **€21.99** |
| 9 | Portekiz | EUR | €2.29 | €11.49 | **€0.79** | **€14.99** |
| 10 | Yunanistan | EUR | €1.99 | €9.99 | **€0.69** | **€12.99** |
| 11 | Hırvatistan | EUR | €1.99 | €9.99 | **€0.69** | **€12.99** |
| 12 | Slovakya | EUR | €2.29 | €11.49 | **€0.79** | **€14.99** |
| 13 | İsveç | SEK | 37 kr | 189 kr | **14 kr** | **239 kr** |
| 14 | Norveç | NOK | 42 kr | 209 kr | **15 kr** | **265 kr** |
| 15 | Danimarka | DKK | 27 kr | 134 kr | **10 kr** | **169 kr** |
| 16 | Avustralya | AUD | A$5.99 | A$29.99 | **A$1.99** | **A$37.99** |
| 17 | Kanada | CAD | CA$4.99 | CA$24.99 | **CA$1.99** | **CA$31.99** |
| 18 | Japonya | JPY | ¥480 | ¥2,400 | **¥180** | **¥3,000** |
| 19 | Güney Kore | KRW | ₩4,400 | ₩22,000 | **₩1,600** | **₩27,500** |
| 20 | Çekya | CZK | 59 Kč | 299 Kč | **22 Kč** | **379 Kč** |
| 21 | Macaristan | HUF | 799 Ft | 3,990 Ft | **299 Ft** | **4,990 Ft** |
| 22 | Polonya | PLN | 8.99 zł | 44.99 zł | **3.49 zł** | **56.99 zł** |
| 23 | Romanya | RON | 8.99 lei | 44.99 lei | **3.49 lei** | **56.99 lei** |
| 24 | BAE | AED | 14.99 د.إ | 74.99 د.إ | **5.49 د.إ** | **94.99 د.إ** |
| 25 | Suudi Arabistan | SAR | 14.99 ر.س | 74.99 ر.س | **5.49 ر.س** | **94.99 ر.س** |
| 26 | İsrail | ILS | ₪11.90 | ₪59.90 | **₪4.49** | **₪74.99** |
| 27 | Tayvan | TWD | NT$120 | NT$599 | **NT$45** | **NT$749** |
| 28 | Hong Kong | HKD | HK$30 | HK$149 | **HK$11** | **HK$188** |
| 29 | Singapur | SGD | S$5.48 | S$26.98 | **S$1.99** | **S$34.99** |
| 30 | Malezya | MYR | RM 6.90 | RM 34.90 | **RM 2.49** | **RM 43.99** |
| 31 | Tayland | THB | ฿45 | ฿229 | **฿15** | **฿289** |
| 32 | Vietnam | VND | ₫25,000 | ₫125,000 | **₫9,000** | **₫159,000** |
| 33 | Türkiye | TRY | ₺59.99 | ₺299.99 | **₺21.99** | **₺374.99** |
| 34 | Ukrayna | UAH | ₴39 | ₴189 | **₴14** | **₴239** |
| 35 | Rusya | RUB | 149 ₽ | 749 ₽ | **₽55** | **₽939** |
| 36 | Meksika | MXN | $29 MX | $149 MX | **$10.99 MX** | **$189 MX** |
| 37 | Brezilya | BRL | R$7.90 | R$39.90 | **R$2.99** | **R$49.90** |
| 38 | Güney Afrika | ZAR | R19.99 | R99.99 | **R6.99** | **R124.99** |
| 39 | Hindistan | INR | ₹79 | ₹399 | **₹29** | **₹499** |
| 40 | Endonezya | IDR | Rp 15,000 | Rp 79,000 | **Rp 5,000** | **Rp 99,000** |
| 41 | Filipinler | PHP | ₱49 | ₱249 | **₱18** | **₱319** |
| 42 | Pakistan | PKR | Rs 179 | Rs 899 | **Rs 69** | **Rs 1,129** |
| 43 | Nijerya | NGN | ₦499 | ₦2,499 | **₦189** | **₦3,129** |

---

## ASC CSV — Weekly Subscription Import

Önce dry-run:
```bash
asc subscriptions pricing prices import \
  --subscription-id WEEKLY_SUB_ID \
  --input ./docs/aso/pricing/raw-data/ab-test-weekly.csv \
  --dry-run \
  --output table
```

```csv
territory,price,start_date
USA,1.49,2026-05-20
GBR,0.99,2026-05-20
DEU,1.29,2026-05-20
FRA,1.29,2026-05-20
NLD,1.29,2026-05-20
ITA,1.29,2026-05-20
ESP,0.99,2026-05-20
FIN,1.19,2026-05-20
PRT,0.79,2026-05-20
GRC,0.69,2026-05-20
HRV,0.69,2026-05-20
SVK,0.79,2026-05-20
SWE,14.00,2026-05-20
NOR,15.00,2026-05-20
DNK,10.00,2026-05-20
AUS,1.99,2026-05-20
CAN,1.99,2026-05-20
JPN,180.00,2026-05-20
KOR,1600.00,2026-05-20
CZE,22.00,2026-05-20
HUN,299.00,2026-05-20
POL,3.49,2026-05-20
ROU,3.49,2026-05-20
ARE,5.49,2026-05-20
SAU,5.49,2026-05-20
ISR,4.49,2026-05-20
TWN,45.00,2026-05-20
HKG,11.00,2026-05-20
SGP,1.99,2026-05-20
MYS,2.49,2026-05-20
THA,15.00,2026-05-20
VNM,9000.00,2026-05-20
TUR,21.99,2026-05-20
UKR,14.00,2026-05-20
RUS,55.00,2026-05-20
MEX,10.99,2026-05-20
BRA,2.99,2026-05-20
ZAF,6.99,2026-05-20
IND,29.00,2026-05-20
IDN,5000.00,2026-05-20
PHL,18.00,2026-05-20
PAK,69.00,2026-05-20
NGA,189.00,2026-05-20
```

---

## ASC CSV — Yearly Subscription Import (A/B)

```bash
asc subscriptions pricing prices import \
  --subscription-id YEARLY_AB_SUB_ID \
  --input ./docs/aso/pricing/raw-data/ab-test-yearly.csv \
  --dry-run \
  --output table
```

```csv
territory,price,start_date
USA,24.99,2026-05-20
GBR,18.99,2026-05-20
DEU,22.99,2026-05-20
FRA,22.99,2026-05-20
NLD,22.99,2026-05-20
ITA,22.99,2026-05-20
ESP,18.99,2026-05-20
FIN,21.99,2026-05-20
PRT,14.99,2026-05-20
GRC,12.99,2026-05-20
HRV,12.99,2026-05-20
SVK,14.99,2026-05-20
SWE,239.00,2026-05-20
NOR,265.00,2026-05-20
DNK,169.00,2026-05-20
AUS,37.99,2026-05-20
CAN,31.99,2026-05-20
JPN,3000.00,2026-05-20
KOR,27500.00,2026-05-20
CZE,379.00,2026-05-20
HUN,4990.00,2026-05-20
POL,56.99,2026-05-20
ROU,56.99,2026-05-20
ARE,94.99,2026-05-20
SAU,94.99,2026-05-20
ISR,74.99,2026-05-20
TWN,749.00,2026-05-20
HKG,188.00,2026-05-20
SGP,34.99,2026-05-20
MYS,43.99,2026-05-20
THA,289.00,2026-05-20
VNM,159000.00,2026-05-20
TUR,374.99,2026-05-20
UKR,239.00,2026-05-20
RUS,939.00,2026-05-20
MEX,189.00,2026-05-20
BRA,49.90,2026-05-20
ZAF,124.99,2026-05-20
IND,499.00,2026-05-20
IDN,99000.00,2026-05-20
PHL,319.00,2026-05-20
PAK,1129.00,2026-05-20
NGA,3129.00,2026-05-20
```

---

## ASC Kurulum Adımları

### 1. Yeni Subscription Group Oluştur
```bash
# Önce App ID'yi doğrula
asc apps list --bundle-id com.ilyastorun.histora

# Weekly subscription oluştur
asc subscriptions setup \
  --app 6759553478 \
  --group-reference-name "Historiq Pro AB" \
  --reference-name "Historiq Pro Weekly" \
  --product-id "com.ilyastorun.histora.pro.weekly" \
  --subscription-period ONE_WEEK \
  --locale "en-US" \
  --display-name "Historiq Pro" \
  --description "Unlock unlimited Time Machine, Deep Dive & more" \
  --price "1.49" \
  --price-territory "USA" \
  --output json

# Yearly subscription (aynı gruba)
asc subscriptions setup \
  --app 6759553478 \
  --group-reference-name "Historiq Pro AB" \
  --reference-name "Historiq Pro Yearly AB" \
  --product-id "com.ilyastorun.histora.pro.annual.ab" \
  --subscription-period ONE_YEAR \
  --locale "en-US" \
  --display-name "Historiq Pro" \
  --description "Unlock unlimited Time Machine, Deep Dive & more" \
  --price "24.99" \
  --price-territory "USA" \
  --output json
```

### 2. Subscription ID'leri Al
```bash
asc subscriptions list --app 6759553478 --output table
```

### 3. PPP Fiyatları Import Et (Weekly)
```bash
# WEEKLY_SUB_ID'yi yukarıdan aldığın ID ile değiştir
asc subscriptions pricing prices import \
  --subscription-id WEEKLY_SUB_ID \
  --input ./docs/aso/pricing/raw-data/ab-test-weekly.csv \
  --dry-run --output table

# Doğruladıktan sonra gerçek import
asc subscriptions pricing prices import \
  --subscription-id WEEKLY_SUB_ID \
  --input ./docs/aso/pricing/raw-data/ab-test-weekly.csv \
  --output table
```

### 4. PPP Fiyatları Import Et (Yearly AB)
```bash
asc subscriptions pricing prices import \
  --subscription-id YEARLY_AB_SUB_ID \
  --input ./docs/aso/pricing/raw-data/ab-test-yearly.csv \
  --dry-run --output table

asc subscriptions pricing prices import \
  --subscription-id YEARLY_AB_SUB_ID \
  --input ./docs/aso/pricing/raw-data/ab-test-yearly.csv \
  --output table
```

### 5. Doğrulama
```bash
asc subscriptions pricing summary --subscription-id WEEKLY_SUB_ID --territory "USA"
asc subscriptions pricing summary --subscription-id WEEKLY_SUB_ID --territory "TUR"
asc subscriptions pricing summary --subscription-id YEARLY_AB_SUB_ID --territory "USA"
asc subscriptions pricing summary --subscription-id YEARLY_AB_SUB_ID --territory "IND"
```

---

## A/B Test Hipotezi

| Grup | Planlar | Hipotez |
|------|---------|---------|
| **Kontrol** (Grup 1) | Monthly $3.99 + Yearly $19.99 | Mevcut dönüşüm baseline |
| **Test** (Grup 2) | Weekly $1.49 + Yearly $24.99 | Weekly düşük taahhüt girişi daha yüksek deneme → yearly dönüşüm; veya weekly'nin %25 daha yüksek yearly'i engellememesi |

**İzlenecek Metrikler:**
- Trial başlatma oranı
- Weekly → Yearly upgrade oranı
- 30/60/90 günlük LTV
- Churn oranı (weekly'ler daha mı yüksek?)

**Önerilen Test Süresi:** 4-6 hafta minimum (istatistiksel anlamlılık için)

---

## Notlar

- **Türkiye (TRY):** Döviz oynaklığı yüksek. Weekly ₺21.99 ve Yearly ₺374.99 yaklaşık değer; çeyreklik manuel kontrol gerekli.
- **Rusya:** App Store'da kısıtlı; CSV'ye dahil edildi ancak aktif olmayabilir.
- **Apple fiyat noktaları:** CSV'deki değerler en yakın Apple tier'ına otomatik yuvarlanır. Dry-run çıktısında "resolved" değerleri kontrol et.
- **Lokalizasyon:** Her iki subscription için de İngilizce lokalizasyon yeterli; Türkçe eklemek istersen `asc subscriptions localizations create` kullanabilirsin.
