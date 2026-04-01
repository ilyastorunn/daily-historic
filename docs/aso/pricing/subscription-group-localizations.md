# Subscription Group Localizations — Historiq Pro

**App:** Historiq - History Daily (`com.ilyastorun.histora`, ASC: `6759553478`)
**Subscription Group:** Historiq Pro

**Kısıtlamalar (ASC):**
- Subscription Group Display Name: max 75 karakter
- App Name Display Options: "Use App Name: Historiq - History Daily" (custom name gerekmez)

**Not:** Group Display Name, kullanıcının abonelik yönetim ekranında görünür. "Historiq Pro" evrensel marka adı olarak tutulur; CJK ve Kiril dilleri için yerel script kullanılır.

---

## Lokalizasyon Tablosu (39 Locale)

| Locale | Dil | Group Display Name | Char |
|--------|-----|--------------------|------|
| `en-US` | İngilizce (ABD) | Historiq Pro | 12 ✓ |
| `en-GB` | İngilizce (İngiltere) | Historiq Pro | 12 ✓ |
| `en-AU` | İngilizce (Avustralya) | Historiq Pro | 12 ✓ |
| `en-CA` | İngilizce (Kanada) | Historiq Pro | 12 ✓ |
| `de-DE` | Almanca | Historiq Pro | 12 ✓ |
| `fr-FR` | Fransızca (Fransa) | Historiq Pro | 12 ✓ |
| `fr-CA` | Fransızca (Kanada) | Historiq Pro | 12 ✓ |
| `nl-NL` | Flemenkçe | Historiq Pro | 12 ✓ |
| `sv` | İsveççe | Historiq Pro | 12 ✓ |
| `no` | Norveçce | Historiq Pro | 12 ✓ |
| `da` | Danca | Historiq Pro | 12 ✓ |
| `fi` | Fince | Historiq Pro | 12 ✓ |
| `it` | İtalyanca | Historiq Pro | 12 ✓ |
| `es-ES` | İspanyolca (İspanya) | Historiq Pro | 12 ✓ |
| `es-MX` | İspanyolca (Meksika) | Historiq Pro | 12 ✓ |
| `pt-BR` | Portekizce (Brezilya) | Historiq Pro | 12 ✓ |
| `pt-PT` | Portekizce (Portekiz) | Historiq Pro | 12 ✓ |
| `ca` | Katalanca | Historiq Pro | 12 ✓ |
| `ro` | Rumence | Historiq Pro | 12 ✓ |
| `hr` | Hırvatça | Historiq Pro | 12 ✓ |
| `pl` | Lehçe | Historiq Pro | 12 ✓ |
| `cs` | Çekçe | Historiq Pro | 12 ✓ |
| `sk` | Slovakça | Historiq Pro | 12 ✓ |
| `hu` | Macarca | Historiq Pro | 12 ✓ |
| `el` | Yunanca | Historiq Pro | 12 ✓ |
| `ru` | Rusça | Historiq Про | 12 ✓ |
| `uk` | Ukraynaca | Historiq Про | 12 ✓ |
| `tr` | Türkçe | Historiq Pro | 12 ✓ |
| `ar-SA` | Arapça | Historiq برو | 12 ✓ |
| `he` | İbranice | Historiq Pro | 12 ✓ |
| `hi` | Hintçe | Historiq Pro | 12 ✓ |
| `ja` | Japonca | Historiq プレミアム | 14 ✓ |
| `ko` | Korece | Historiq 프리미엄 | 13 ✓ |
| `zh-Hans` | Çince (Basitleştirilmiş) | Historiq 高级版 | 12 ✓ |
| `zh-Hant` | Çince (Geleneksel) | Historiq 高級版 | 12 ✓ |
| `th` | Tayca | Historiq Pro | 12 ✓ |
| `ms` | Malayca | Historiq Pro | 12 ✓ |
| `vi` | Vietnamca | Historiq Pro | 12 ✓ |
| `id` | Endonezce | Historiq Pro | 12 ✓ |

---

## Çeviri Notları

| Dil Grubu | Kural | Örnek |
|-----------|-------|-------|
| Çoğu Latin dili | "Pro" kelimesi evrensel, değişmez | Historiq Pro |
| Japonca | "プレミアム" (puremiamu = premium) | Historiq プレミアム |
| Korece | "프리미엄" (peurimiom = premium) | Historiq 프리미엄 |
| Çince (Basit) | "高级版" (gāojí bǎn = premium sürüm) | Historiq 高级版 |
| Çince (Geleneksel) | "高級版" (gāojí bǎn = premium sürüm) | Historiq 高級版 |
| Rusça / Ukraynaca | "Про" (Kiril "Pro") | Historiq Про |
| Arapça | "برو" (Arapça harflerle "Pro") | Historiq برو |
| İbranice | "Pro" (Latin harfleri RTL bağlamında çalışır) | Historiq Pro |

---

## ASC CLI Komutları

Subscription group lokalizasyonları ASC CLI ile şu şekilde yönetilir:

```bash
GROUP_ID="<buraya_group_id_gel>"

# Mevcut lokalizasyonları listele
asc subscription-groups localizations list --group-id $GROUP_ID --output table

# Lokalizasyon oluştur (her locale için)
asc subscription-groups localizations create \
  --group-id $GROUP_ID \
  --locale "ja" \
  --custom-app-name "Historiq - History Daily" \
  --name "Historiq プレミアム"
```

> **Not:** "App Name Display Options" ayarı ASC web arayüzünden yapılır. "Use App Name" seçildiğinde `--custom-app-name` parametresi gerekli olmayabilir; ASC versiyonuna göre kontrol edin.
