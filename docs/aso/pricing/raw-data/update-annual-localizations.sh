#!/bin/bash
# Historiq Pro — Annual Subscription Localization Updates
# Mevcut canlı subscription'daki yanlış % değerlerini düzeltir.
#
# ÖNCE: Yıllık subscription ID'nizi alın:
#   asc subscriptions list --app 6759553478 --output table
#
# SONRA: ANNUAL_ID değerini doldurun ve çalıştırın:
#   bash docs/aso/pricing/raw-data/update-annual-localizations.sh

set -e

ANNUAL_ID="<ANNUAL_SUBSCRIPTION_ID_BURAYA>"

# Önce mevcut localization ID'lerini listele
echo "Mevcut localization ID'leri alınıyor..."
asc subscriptions localizations list --subscription-id $ANNUAL_ID --output json > /tmp/annual_locs.json
echo "Kaydedildi: /tmp/annual_locs.json"
echo ""
echo "Localization ID'leri:"
cat /tmp/annual_locs.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('data', []):
    locale = item.get('attributes', {}).get('locale', '')
    name = item.get('attributes', {}).get('name', '')
    print(f\"  {locale:<12} ID: {item['id']}  Name: {name}\")
"
echo ""
echo "---"
echo "Güncelleme başlıyor..."
echo ""

# Fonksiyon: locale'e göre localization ID bul ve güncelle
update_loc() {
  local LOCALE=$1
  local NEW_DESC=$2
  local LOC_ID=$(python3 -c "
import json
with open('/tmp/annual_locs.json') as f:
    data = json.load(f)
for item in data.get('data', []):
    if item.get('attributes', {}).get('locale') == '$LOCALE':
        print(item['id'])
        break
")
  if [ -z "$LOC_ID" ]; then
    echo "⚠️  $LOCALE için localization bulunamadı, atlanıyor."
    return
  fi
  asc subscriptions localizations update \
    --localization-id "$LOC_ID" \
    --description "$NEW_DESC" \
    --output json > /dev/null
  echo "✓ $LOCALE güncellendi → \"$NEW_DESC\""
}

# Sadece değişen 11 locale güncelleniyor
update_loc "de-DE"   "Bestes Angebot – 57 % gegenüber monatlich"
update_loc "fr-FR"   "Meilleur prix – économisez 57 % vs mensuel"
update_loc "nl-NL"   "Beste waarde – 57% besparen vs maandelijks"
update_loc "sv"      "Bästa värde – spara 57 % vs månadsvis"
update_loc "es-MX"   "El mejor precio – ahorra un 57 % vs mensual"
update_loc "fi"      "Paras arvo – säästä 57 % vs kk"
update_loc "it"      "Miglior valore – risparmi il 57% vs mens."
update_loc "id"      "Nilai terbaik – hemat 56% vs bulanan"
update_loc "zh-Hans" "最佳价值 – 比月付节省56%"
update_loc "pt-PT"   "Melhor valor – poupe 53% vs mensal"
update_loc "sk"      "Najlepšia hodnota – ušetrite 53% vs mes."

echo ""
echo "=== TAMAMLANDI: 11 localization güncellendi ==="
