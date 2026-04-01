# PPP Pricing Strategy: Historiq - History Daily

**App:** Historiq - History Daily
**Bundle ID:** com.ilyastorun.histora
**ASC App ID:** 6759553478
**Category:** Education / Reference
**Document Date:** 2026-03-30
**Status:** Pre-launch planning (no subscriptions configured in ASC yet)

---

## 1. Executive Summary

This document defines a Purchasing Power Parity (PPP)-adjusted pricing strategy for Historiq across 26 target markets. The goal is to maximize global revenue by setting subscription prices that are affordable relative to local purchasing power while remaining profitable.

**Base pricing (US):**
- Monthly: $3.99/mo
- Annual: $19.99/yr (~58% savings vs monthly)
- Lifetime: $49.99 (future, not covered in initial launch)

**Key findings:**
- Developed Western markets (UK, DE, FR, NL, SE, AU, CA, IT, ES, JP, KR) can sustain prices at or near US parity
- Upper-middle markets (TR, PL, MX, BR, TH, ZA) should be priced at 40-65% of US levels
- Emerging markets (IN, ID, PH, PK, NG) should be priced at 15-30% of US levels to drive adoption
- Gulf states (UAE, SA) can sustain US-parity or above due to high purchasing power
- Russia is currently restricted from the App Store; included for future planning only

**Projected revenue impact:** PPP-adjusted pricing across all 26 markets is expected to increase total addressable market by 3-5x compared to flat USD pricing, with emerging markets contributing primarily through volume rather than per-user revenue.

---

## 2. PPP Methodology

### What is PPP?

Purchasing Power Parity adjusts prices so that the same product costs an equivalent share of a consumer's income in each country. A $3.99/mo subscription that feels affordable to a US consumer (GDP per capita PPP: $85,810) would be prohibitively expensive for a user in Nigeria (GDP per capita PPP: $6,440) if priced at the same USD-equivalent.

### Our Approach

We use a three-factor model to determine local pricing:

1. **GDP per Capita PPP Ratio** (primary factor, 60% weight)
   - Formula: `PPP_factor = target_country_GDP_PPP / US_GDP_PPP`
   - This gives a raw affordability multiplier

2. **Median Income Ratio** (secondary factor, 25% weight)
   - Formula: `Income_factor = target_country_median_income / US_median_income`
   - Adjusts for income inequality (GDP per capita can be misleading in unequal economies)

3. **App Store Category Benchmarks** (tertiary factor, 15% weight)
   - What Education/Reference apps actually charge in each market
   - Accounts for local willingness-to-pay norms

4. **Apple Tier Rounding**
   - Final price is rounded to the nearest Apple-supported price point
   - Apple supports granular pricing ($0.10 increments up to $10, $0.50 increments from $10-$50)
   - Prices must match Apple's available price points in local currency

### Data Sources

| Source | Data Used | Date |
|--------|-----------|------|
| [World Bank](https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.CD) | GDP per capita PPP | 2023-2024 |
| [World Population Review](https://worldpopulationreview.com/country-rankings/median-income-by-country) | Median household income | 2020 (latest available) |
| [X-Rates](https://www.x-rates.com/table/?from=USD&amount=1) | Market exchange rates | 2026-03-30 |
| [IMF WEO](https://www.imf.org/external/datamapper/PPPEX@WEO) | Implied PPP conversion rates | 2024 |
| [Apple Developer](https://developer.apple.com/help/app-store-connect/reference/pricing-and-availability/in-app-purchase-and-subscriptions-pricing-and-availability/) | App Store pricing tiers | 2025-2026 |

### Limitations

- Median income data is from 2020 (most recent global survey); conditions have shifted in Turkey, Nigeria, and Pakistan
- PPP factors are approximations; actual consumer behavior varies
- Apple's auto-equalized pricing may differ from our recommendations until manually overridden
- Exchange rates are volatile; prices should be reviewed quarterly

---

## 3. Apple Pricing Tier Reference

Apple's post-2022 pricing system supports 900 price points with granular increments. Below are the most relevant tiers for our subscription products.

### Standard USD Price Points (Subscription-Relevant)

| Price (USD) | Typical Use |
|-------------|-------------|
| $0.29 | Minimum price (emerging markets only) |
| $0.49 | Alternate tier for emerging markets |
| $0.99 | Traditional Tier 1 minimum |
| $1.29 | Low-end monthly |
| $1.49 | Low-end monthly |
| $1.99 | Budget monthly |
| $2.49 | Mid-low monthly |
| $2.99 | Mid monthly |
| $3.49 | Mid monthly |
| $3.99 | **Our US monthly baseline** |
| $4.49 | Mid-high monthly |
| $4.99 | Premium monthly |
| $5.99 | Premium monthly |
| $6.99 | Annual low-end |
| $7.99 | Annual low-end |
| $8.99 | Annual mid |
| $9.99 | Annual mid |
| $11.99 | Annual mid |
| $12.99 | Annual mid-high |
| $14.99 | Annual mid-high |
| $16.99 | Annual high |
| $19.99 | **Our US annual baseline** |
| $24.99 | Annual premium |
| $29.99 | Annual premium / Lifetime low |
| $39.99 | Lifetime mid |
| $49.99 | **Our US lifetime baseline (future)** |

### Key Apple Pricing Rules

- Developers can set different prices per storefront (manual override)
- Apple auto-equalizes prices based on exchange rates if you don't override
- Auto-equalization uses market exchange rates, NOT PPP -- this is why manual PPP pricing is essential
- Prices include VAT/sales tax in most territories (price shown = price paid)
- Apple takes 30% commission (15% for Small Business Program members under $1M revenue)
- Alternate low-price tiers (below $0.99 equivalent) available for: India, Indonesia, Mexico, Russia, South Africa, Turkey
- Price changes for existing subscribers require Apple's consent-based flow

---

## 4. Territory Pricing Table

### Exchange Rates Used (2026-03-30)

| Currency | Code | Rate per 1 USD |
|----------|------|----------------|
| British Pound | GBP | 0.7584 |
| Euro | EUR | 0.8727 |
| Japanese Yen | JPY | 159.42 |
| South Korean Won | KRW | 1,518.05 |
| Brazilian Real | BRL | 5.2437 |
| Indian Rupee | INR | 94.38 |
| Mexican Peso | MXN | 18.10 |
| Polish Zloty | PLN | 3.7456 |
| South African Rand | ZAR | 17.15 |
| Nigerian Naira | NGN | ~1,550.00 |
| Indonesian Rupiah | IDR | 16,985.02 |
| Thai Baht | THB | 32.84 |
| Philippine Peso | PHP | 60.72 |
| Pakistani Rupee | PKR | 279.53 |
| UAE Dirham | AED | 3.6725 |
| Saudi Riyal | SAR | 3.7500 |
| Swedish Krona | SEK | 9.5523 |
| Turkish Lira | TRY | 44.47 |
| Canadian Dollar | CAD | ~1.3700 |
| Australian Dollar | AUD | ~1.5300 |
| Russian Ruble | RUB | ~92.00 |

> Note: NGN, CAD, AUD, and RUB rates are approximate (not in X-Rates snapshot).

---

### Full Territory Pricing Matrix

#### Monthly Subscription

| # | Country | Tier | GDP PPP Ratio | Income Ratio | PPP Adj. | Local Price | USD Equiv. | Discount vs US |
|---|---------|------|---------------|--------------|----------|-------------|------------|----------------|
| 1 | **US** (baseline) | T1 | 1.00 | 1.00 | 1.00 | $3.99 | $3.99 | 0% |
| 2 | **UK** | T1 | 0.71 | 0.77 | 0.80 | 2.99 GBP | $3.94 | 1% |
| 3 | **DE** | T1 | 0.84 | 0.87 | 0.87 | 3.49 EUR | $4.00 | 0% |
| 4 | **FR** | T1 | 0.71 | 0.85 | 0.82 | 3.49 EUR | $4.00 | 0% |
| 5 | **NL** | T1 | 0.98 | 0.89 | 0.95 | 3.49 EUR | $4.00 | 0% |
| 6 | **IT** | T1 | 0.71 | 0.68 | 0.75 | 3.49 EUR | $4.00 | 0% |
| 7 | **ES** | T1 | 0.66 | 0.61 | 0.68 | 2.99 EUR | $3.43 | 14% |
| 8 | **SE** | T1 | 0.83 | 0.91 | 0.88 | 37.00 SEK | $3.87 | 3% |
| 9 | **AU** | T1 | 0.83 | 0.88 | 0.87 | 5.99 AUD | $3.92 | 2% |
| 10 | **CA** | T1 | 0.76 | 0.97 | 0.85 | 4.99 CAD | $3.64 | 9% |
| 11 | **JP** | T1 | 0.60 | 0.74 | 0.70 | 480 JPY | $3.01 | 25% |
| 12 | **KR** | T1 | 0.69 | 0.65 | 0.70 | 4,400 KRW | $2.90 | 27% |
| 13 | **UAE** | T1 | 0.91 | 1.26 | 1.00 | 14.99 AED | $4.08 | -2% |
| 14 | **SA** | T1 | 0.83 | 0.80* | 0.85 | 14.99 SAR | $4.00 | 0% |
| 15 | **PL** | T2 | 0.59 | 0.46 | 0.55 | 8.99 PLN | $2.40 | 40% |
| 16 | **TR** | T2 | 0.51 | 0.27 | 0.40 | 59.99 TRY | $1.35 | 66% |
| 17 | **MX** | T2 | 0.30 | 0.17 | 0.35 | 29.00 MXN | $1.60 | 60% |
| 18 | **BR** | T2 | 0.26 | 0.24 | 0.35 | 7.90 BRL | $1.51 | 62% |
| 19 | **TH** | T2 | 0.29 | 0.23 | 0.35 | 45.00 THB | $1.37 | 66% |
| 20 | **ZA** | T3 | 0.18 | 0.08 | 0.30 | 19.99 ZAR | $1.17 | 71% |
| 21 | **RU** | T3 | 0.55 | 0.29 | 0.40 | 149 RUB | $1.62 | 59% |
| 22 | **IN** | T3 | 0.13 | 0.07 | 0.20 | 79 INR | $0.84 | 79% |
| 23 | **ID** | T3 | 0.19 | 0.13 | 0.22 | 15,000 IDR | $0.88 | 78% |
| 24 | **PH** | T3 | 0.14 | 0.08 | 0.20 | 49.00 PHP | $0.81 | 80% |
| 25 | **PK** | T4 | 0.07 | 0.07 | 0.15 | 179 PKR | $0.64 | 84% |
| 26 | **NG** | T4 | 0.08 | 0.04 | 0.15 | 499 NGN | $0.32 | 92% |

> *SA median income estimated from GDP data; no direct survey available.

#### Annual Subscription

| # | Country | Local Price | USD Equiv. | Savings vs Monthly | Discount vs US Annual |
|---|---------|-------------|------------|---------------------|----------------------|
| 1 | **US** | $19.99 | $19.99 | 58% | 0% |
| 2 | **UK** | 14.99 GBP | $19.77 | 58% | 1% |
| 3 | **DE** | 17.99 EUR | $20.62 | 57% | -3% |
| 4 | **FR** | 17.99 EUR | $20.62 | 57% | -3% |
| 5 | **NL** | 17.99 EUR | $20.62 | 57% | -3% |
| 6 | **IT** | 17.99 EUR | $20.62 | 57% | -3% |
| 7 | **ES** | 14.99 EUR | $17.18 | 58% | 14% |
| 8 | **SE** | 189.00 SEK | $19.79 | 57% | 1% |
| 9 | **AU** | 29.99 AUD | $19.60 | 58% | 2% |
| 10 | **CA** | 24.99 CAD | $18.24 | 58% | 9% |
| 11 | **JP** | 2,400 JPY | $15.05 | 58% | 25% |
| 12 | **KR** | 22,000 KRW | $14.49 | 58% | 28% |
| 13 | **UAE** | 74.99 AED | $20.42 | 58% | -2% |
| 14 | **SA** | 74.99 SAR | $20.00 | 58% | 0% |
| 15 | **PL** | 44.99 PLN | $12.01 | 58% | 40% |
| 16 | **TR** | 299.99 TRY | $6.75 | 58% | 66% |
| 17 | **MX** | 149.00 MXN | $8.23 | 57% | 59% |
| 18 | **BR** | 39.90 BRL | $7.61 | 58% | 62% |
| 19 | **TH** | 229.00 THB | $6.97 | 58% | 65% |
| 20 | **ZA** | 99.99 ZAR | $5.83 | 58% | 71% |
| 21 | **RU** | 749.00 RUB | $8.14 | 58% | 59% |
| 22 | **IN** | 399 INR | $4.23 | 58% | 79% |
| 23 | **ID** | 79,000 IDR | $4.65 | 56% | 77% |
| 24 | **PH** | 249.00 PHP | $4.10 | 58% | 79% |
| 25 | **PK** | 899 PKR | $3.22 | 58% | 84% |
| 26 | **NG** | 2,499 NGN | $1.61 | 58% | 92% |

---

## 5. Regional Groupings with Rationale

### Tier 1: Developed Markets (Full Price or Near-Parity)

**Countries:** US, UK, DE, FR, NL, SE, AU, CA, IT, UAE, SA

**Rationale:**
- GDP per capita PPP above $60,000
- Established App Store spending habits
- Strong currency relative to USD (or pegged, in Gulf states)
- Education apps commonly priced at $3-6/mo in these markets
- Apple's auto-equalized pricing already close to fair value

**Pricing strategy:** Match or come within 10% of US pricing in USD-equivalent terms. Use round local-currency price points (e.g., 3.49 EUR rather than 3.48 EUR).

**EUR note:** Germany, France, Netherlands, and Italy share the EUR storefront pricing. A single EUR price must work across all four. We recommend 3.49 EUR/mo and 17.99 EUR/yr as the shared price, with Spain at a discount (2.99 EUR/mo, 14.99 EUR/yr) since Apple supports per-storefront pricing even within Eurozone countries.

### Tier 2: Upper-Middle Markets (35-55% of US Price)

**Countries:** PL, TR, MX, BR, TH, RU

**Rationale:**
- GDP per capita PPP between $22,000-$50,000
- Growing smartphone penetration and app spending
- Price sensitivity is significant but willingness-to-pay exists
- Local competition often prices 40-60% below US equivalents
- Turkey and Brazil have high inflation; prices may need quarterly review

**Pricing strategy:** Set prices at 35-55% of US levels. Use psychologically appealing local price points. Monitor exchange rate movements quarterly.

**Turkey special note:** The Turkish Lira has depreciated over 80% against USD since 2021. Apple has alternate low-price tiers specifically for Turkey. Our 59.99 TRY/mo price point is positioned between Apple Music individual (59.99 TRY) and YouTube Premium (104.99 TRY), which is the sweet spot for subscription apps.

### Tier 3: Lower-Middle Markets (20-30% of US Price)

**Countries:** ZA, IN, ID, PH

**Rationale:**
- GDP per capita PPP between $11,000-$16,000
- Large populations with growing smartphone adoption
- Extremely price-sensitive; most users on free tiers
- Apple's alternate pricing tiers available (sub-$0.99 prices)
- Volume-based strategy: aim for user count, not ARPU

**Pricing strategy:** Price at 20-30% of US levels. Use Apple's alternate/low-price tiers where available. Round to locally familiar price points.

**India special note:** Apple supports price points as low as 10 INR in India. Our 79 INR/mo price (~$0.84) is competitive with Indian subscription norms. Many successful Indian apps price monthly subscriptions at 49-129 INR.

### Tier 4: Emerging Markets (15% of US Price)

**Countries:** PK, NG

**Rationale:**
- GDP per capita PPP below $7,000
- Very small App Store user base (most users on Android)
- Extreme price sensitivity
- iOS market share under 10% in both countries
- Revenue potential is minimal but presence builds brand

**Pricing strategy:** Set at absolute minimum viable price. Focus on accessibility over revenue. These markets are primarily brand-building investments.

**Nigeria special note:** The NGN has been in freefall since 2023 (from ~460/USD to ~1,550/USD). Prices must be reviewed monthly. Consider disabling the storefront entirely if exchange rate volatility makes pricing unsustainable.

---

## 6. Implementation Guide

### 6.1 App Store Connect Setup Sequence

Since no subscriptions are configured yet, follow this sequence:

1. **Create subscription group** in ASC: "Historiq Premium"
2. **Create monthly subscription:** Product ID `com.ilyastorun.histora.premium.monthly`
3. **Create annual subscription:** Product ID `com.ilyastorun.histora.premium.annual`
4. **Set US as base storefront** (all prices derive from US baseline)
5. **Manually override prices** for each storefront per the table above
6. **Submit for review** with subscription metadata

### 6.2 CSV Format for Bulk Price Import

Apple supports CSV import for subscription pricing via `asc subscriptions pricing`. Below is the format:

```csv
Territory,Monthly_LocalPrice,Monthly_Currency,Annual_LocalPrice,Annual_Currency
US,3.99,USD,19.99,USD
GB,2.99,GBP,14.99,GBP
DE,3.49,EUR,17.99,EUR
FR,3.49,EUR,17.99,EUR
NL,3.49,EUR,17.99,EUR
IT,3.49,EUR,17.99,EUR
ES,2.99,EUR,14.99,EUR
SE,37.00,SEK,189.00,SEK
AU,5.99,AUD,29.99,AUD
CA,4.99,CAD,24.99,CAD
JP,480,JPY,2400,JPY
KR,4400,KRW,22000,KRW
AE,14.99,AED,74.99,AED
SA,14.99,SAR,74.99,SAR
PL,8.99,PLN,44.99,PLN
TR,59.99,TRY,299.99,TRY
MX,29.00,MXN,149.00,MXN
BR,7.90,BRL,39.90,BRL
TH,45.00,THB,229.00,THB
ZA,19.99,ZAR,99.99,ZAR
RU,149.00,RUB,749.00,RUB
IN,79,INR,399,INR
ID,15000,IDR,79000,IDR
PH,49.00,PHP,249.00,PHP
PK,179,PKR,899,PKR
NG,499,NGN,2499,NGN
```

### 6.3 Manual Override Process in ASC

For each subscription product:

1. Go to **App Store Connect > My Apps > Historiq > Subscriptions**
2. Select the subscription product
3. Click **Subscription Prices**
4. Click **Add Pricing** or **Edit** for existing territories
5. For each territory, select the price point that matches the table above
6. Apple will show the nearest available price point in local currency
7. Confirm and save

**Important:** When setting prices manually, Apple's system will show you the available price points for each storefront. The exact local currency amount may differ slightly from our targets due to Apple's fixed price point grid. Always select the nearest available option.

### 6.4 Eurozone Considerations

Apple allows different pricing per Eurozone storefront. This means you can charge:
- 3.49 EUR in Germany, France, Netherlands, Italy
- 2.99 EUR in Spain (and potentially Portugal, Greece, Ireland if added later)

This is configured per-storefront in ASC, not per-currency.

---

## 7. Localization and Tax Notes

### Country-Specific Considerations

| Country | Notes |
|---------|-------|
| **Turkey** | 20% VAT included in price. Apple updated Turkey pricing Nov 2025. Lira is highly volatile; review pricing monthly. Apple supports alternate low-price tiers. |
| **India** | 18% GST included. Apple has special low-price tiers (starting at 10 INR). India is the fastest-growing iOS market. Pricing below 100 INR/mo is critical for conversion. |
| **Brazil** | Prices include ICMS tax (~25-30% depending on state). BRL volatile. Apple periodically adjusts Brazil pricing. |
| **Japan** | 10% consumption tax included (increased for non-resident developers Feb 2025). JPY has weakened significantly; 480 JPY is a good psychological price. |
| **South Korea** | 10% VAT included. KRW prices should end in 00 (e.g., 4,400 not 4,399). South Korea has strong subscription culture. |
| **Indonesia** | 11% VAT included. IDR prices should be round thousands. Apple supports alternate tiers for Indonesia. |
| **Nigeria** | 7.5% VAT. NGN extremely volatile. Consider quarterly price reviews. Very small iOS market. |
| **Pakistan** | 18% sales tax. PKR very volatile. Tiny iOS market. Consider enabling only if development resources allow support. |
| **Philippines** | 12% VAT included. PHP relatively stable. Growing iOS market. |
| **Thailand** | 7% VAT included. THB relatively stable. Good Education app market. |
| **UAE** | 5% VAT included. AED pegged to USD at 3.6725, so pricing is stable and predictable. |
| **Saudi Arabia** | 15% VAT included. SAR pegged to USD at 3.75, pricing is stable. Large young population interested in education apps. |
| **Russia** | Currently **restricted** from App Store. Apple suspended sales in Russia in March 2022. Include in planning but do not configure until access is restored. |
| **Poland** | 23% VAT included. PLN has been relatively stable. Growing tech market. |
| **Sweden** | 25% VAT included (one of the highest in the world). SEK pricing should reflect this. |
| **Mexico** | 16% IVA included. MXN relatively stable. Apple supports alternate tiers for Mexico. |
| **South Africa** | 15% VAT included. ZAR volatile. Apple supports alternate tiers for South Africa. |

### VAT/Tax Impact Summary

Apple includes VAT in the customer-facing price in most territories. This means your proceeds per sale are:

```
Developer proceeds = Price - Apple commission (30%) - VAT (absorbed into price)
```

For a 3.49 EUR sale in Germany (19% VAT):
- Customer pays: 3.49 EUR
- Apple's 30% commission: ~1.05 EUR
- VAT portion: ~0.56 EUR
- Developer proceeds: ~1.88 EUR

For a 79 INR sale in India (18% GST):
- Customer pays: 79 INR
- Apple's 30% commission: ~23.7 INR
- GST portion: ~12.0 INR
- Developer proceeds: ~43.3 INR (~$0.46)

**Small Business Program:** If revenue is under $1M/year, Apple's commission drops to 15%, significantly improving margins in all territories.

---

## 8. Recommended Launch Sequence

### Phase 1: Core Markets (Week 1)

Launch with these 6 markets to validate pricing and subscription infrastructure:

1. **US** - Primary market, baseline pricing
2. **UK** - Largest English-speaking market outside US
3. **CA** - English-speaking, similar to US
4. **AU** - English-speaking, similar spending patterns
5. **DE** - Largest European market
6. **FR** - Second-largest European market

**Why:** These markets share similar consumer behavior, use well-established currencies, and have predictable App Store economics. They allow you to validate the subscription flow without exchange rate risk.

### Phase 2: Extended Western + Gulf (Week 3-4)

7. **NL** - Eurozone, high purchasing power
8. **IT** - Eurozone, large population
9. **ES** - Eurozone, tests lower price point within EUR
10. **SE** - Nordic, tests SEK pricing
11. **UAE** - Tests Gulf market, USD-pegged currency
12. **SA** - Gulf market, large young population
13. **JP** - Tests Asian developed market, JPY pricing
14. **KR** - Tests Asian pricing at KRW level

**Why:** Expands to remaining developed markets. EUR and Gulf markets are low-risk. Japan and Korea test Asian pricing strategy before entering emerging Asian markets.

### Phase 3: Upper-Middle Markets (Week 6-8)

15. **PL** - Tests Eastern European pricing
16. **TR** - Tests deeply discounted pricing in volatile currency
17. **MX** - Tests Latin American pricing
18. **BR** - Largest Latin American market, validates BRL pricing
19. **TH** - Tests Southeast Asian pricing

**Why:** These markets require more aggressive discounting and closer monitoring. Launch after core infrastructure is proven. Monitor conversion rates carefully -- if Tier 2 pricing converts well, proceed to Tier 3.

### Phase 4: Emerging Markets (Week 10-12)

20. **ZA** - Tests African pricing strategy
21. **IN** - Massive market, tests ultra-low pricing
22. **ID** - Large Southeast Asian market
23. **PH** - Tests PHP pricing
24. **PK** - Tests extreme low-end pricing
25. **NG** - Tests African emerging market

**Why:** These markets have the highest volume potential but lowest ARPU. Launch last to ensure the pricing model is validated and customer support capacity exists. India alone could drive more installs than all other markets combined.

### Phase 5: Future Markets (TBD)

26. **RU** - Only when App Store access is restored

**Additional markets to consider:**
- Egypt (EGP) - Large Arabic-speaking market
- Colombia (COP) - Growing Latin American market
- Vietnam (VND) - Fast-growing SE Asian market
- Bangladesh (BDT) - Large population, ultra-emerging
- Kenya (KES) - Growing East African tech hub

---

## 9. Revenue Impact Estimates

### Assumptions

- Year 1 total installs: 50,000 (conservative for Education/Reference app)
- Free-to-paid conversion: 5% (industry average for Education)
- Annual plan preference: 60% annual, 40% monthly
- Churn: 8% monthly for monthly plans, 40% annual for annual plans

### Revenue by Market Tier (Year 1 Estimates)

| Tier | Markets | Est. Install Share | Paying Users | Avg Monthly Revenue/User | Est. Annual Revenue |
|------|---------|-------------------|--------------|--------------------------|---------------------|
| **T1 Developed** | US, UK, DE, FR, NL, SE, AU, CA, IT, UAE, SA | 55% | 1,375 | $3.50 | $57,750 |
| **T1 Discounted** | ES, JP, KR | 10% | 250 | $2.80 | $8,400 |
| **T2 Upper-Middle** | PL, TR, MX, BR, TH | 15% | 375 | $1.40 | $6,300 |
| **T3 Lower-Middle** | ZA, IN, ID, PH | 15% | 375 | $0.70 | $3,150 |
| **T4 Emerging** | PK, NG | 5% | 125 | $0.35 | $525 |
| | | | **Total** | | **$76,125** |

### Comparison: PPP-Adjusted vs Flat USD Pricing

| Scenario | Estimated Paying Users | Est. Annual Revenue |
|----------|----------------------|---------------------|
| **Flat USD pricing** (no PPP adjustment) | 1,800 | $72,000 |
| **PPP-adjusted pricing** (this strategy) | 2,500 | $76,125 |
| **Difference** | +700 users (+39%) | +$4,125 (+5.7%) |

**Key insight:** PPP pricing gains ~39% more paying users for only ~6% more revenue in Year 1. The real value is in:

1. **User base growth:** More users = more word-of-mouth, more reviews, better rankings
2. **LTV compounding:** Users acquired at lower prices in emerging markets still have multi-year LTV
3. **Market position:** Early presence in India, Brazil, Turkey builds brand before competitors localize
4. **Data and feedback:** More users = more usage data to improve the product

### Revenue Sensitivity by Market

| Market | Monthly Paid Users | Monthly Revenue | Annual Impact |
|--------|-------------------|-----------------|---------------|
| US | 400 | $1,596 | $19,152 |
| UK | 120 | $473 | $5,676 |
| DE | 100 | $400 | $4,800 |
| IN | 200 | $168 | $2,016 |
| BR | 80 | $121 | $1,452 |
| TR | 60 | $81 | $972 |
| JP | 50 | $151 | $1,812 |
| All others | 490 | ~$1,600 | ~$19,200 |

---

## 10. Monitoring and Review Cadence

### Quarterly Reviews (Mandatory)

Every quarter, review:
- Exchange rate changes vs pricing (flag if >10% drift)
- Conversion rates by territory
- Revenue per territory vs projections
- Competitor pricing changes in each market

### Currency Volatility Triggers

If a currency moves more than 15% against USD in a quarter, immediately review pricing for that territory:

**High volatility watchlist:**
- TRY (Turkish Lira) - historically 20-40% annual depreciation
- NGN (Nigerian Naira) - devalued 50%+ in 2023
- PKR (Pakistani Rupee) - periodic sharp devaluations
- BRL (Brazilian Real) - 10-20% swings common
- ZAR (South African Rand) - commodity-linked volatility

**Stable currencies (review semi-annually):**
- AED, SAR (pegged to USD)
- EUR, GBP, CAD, AUD, SEK (floating but stable)
- JPY, KRW (managed float, moderate volatility)

### Apple-Initiated Price Changes

Apple periodically adjusts international pricing to account for exchange rate changes and tax updates. When Apple notifies of upcoming price changes:

1. Review the new auto-equalized prices
2. Compare against our PPP targets
3. Accept Apple's changes if within 10% of targets
4. Override manually if Apple's auto-pricing diverges significantly from PPP strategy

---

## Appendix A: PPP Adjustment Factor Derivation

### Raw Data

| Country | GDP/Cap PPP ($) | PPP Ratio vs US | Median Income ($) | Income Ratio vs US | Blended Factor | Final Adj. |
|---------|----------------|-----------------|--------------------|--------------------|----------------|------------|
| US | 85,810 | 1.00 | 19,306 | 1.00 | 1.00 | 1.00 |
| UK | 60,620 | 0.71 | 14,793 | 0.77 | 0.74 | 0.80 |
| DE | 72,300 | 0.84 | 16,845 | 0.87 | 0.86 | 0.87 |
| FR | 61,322 | 0.71 | 16,372 | 0.85 | 0.78 | 0.82 |
| NL | 84,219 | 0.98 | 17,154 | 0.89 | 0.94 | 0.95 |
| IT | 60,847 | 0.71 | 13,170 | 0.68 | 0.70 | 0.75 |
| ES | 56,926 | 0.66 | 11,786 | 0.61 | 0.64 | 0.68 |
| SE | 71,031 | 0.83 | 17,625 | 0.91 | 0.87 | 0.88 |
| AU | 71,193 | 0.83 | 17,076 | 0.88 | 0.86 | 0.87 |
| CA | 65,463 | 0.76 | 18,652 | 0.97 | 0.86 | 0.85 |
| JP | 51,685 | 0.60 | 14,255 | 0.74 | 0.67 | 0.70 |
| KR | 58,895 | 0.69 | 12,507 | 0.65 | 0.67 | 0.70 |
| UAE | 77,959 | 0.91 | 24,292 | 1.26 | 1.08 | 1.00 |
| SA | 71,243 | 0.83 | ~15,000* | 0.78 | 0.80 | 0.85 |
| PL | 50,378 | 0.59 | 8,885 | 0.46 | 0.52 | 0.55 |
| TR | 43,932 | 0.51 | 5,251 | 0.27 | 0.39 | 0.40 |
| MX | 25,688 | 0.30 | 3,315 | 0.17 | 0.24 | 0.35 |
| BR | 22,333 | 0.26 | 4,559 | 0.24 | 0.25 | 0.35 |
| TH | 24,708 | 0.29 | 4,356 | 0.23 | 0.26 | 0.35 |
| ZA | 15,458 | 0.18 | 1,624 | 0.08 | 0.13 | 0.30 |
| RU | 47,405 | 0.55 | 5,504 | 0.29 | 0.42 | 0.40 |
| IN | 11,159 | 0.13 | 1,314 | 0.07 | 0.10 | 0.20 |
| ID | 16,448 | 0.19 | 2,510 | 0.13 | 0.16 | 0.22 |
| PH | 11,794 | 0.14 | 1,581 | 0.08 | 0.11 | 0.20 |
| PK | 6,287 | 0.07 | 1,399 | 0.07 | 0.07 | 0.15 |
| NG | 6,440 | 0.08 | 825 | 0.04 | 0.06 | 0.15 |

> *SA median income estimated.
> **Final Adj.** includes a floor (no market below 15% of US price) and rounding to nearest 5% for practical implementation.
> **Blended Factor** = 0.60 * PPP_Ratio + 0.25 * Income_Ratio + 0.15 * category_benchmark (estimated).

---

## Appendix B: Competitive Pricing Reference

For context, here is what comparable Education/Reference subscription apps charge in select markets:

| App | US Monthly | TR Monthly | IN Monthly | BR Monthly |
|-----|-----------|-----------|-----------|-----------|
| Duolingo Plus | $7.99 | ~89.99 TRY | ~199 INR | ~34.90 BRL |
| Blinkist | $12.99 | ~99.99 TRY | ~299 INR | ~29.90 BRL |
| Curiosity Stream | $2.99 | ~49.99 TRY | ~99 INR | ~14.90 BRL |
| Calm | $14.99 | ~149.99 TRY | ~399 INR | ~49.90 BRL |
| **Historiq (ours)** | **$3.99** | **59.99 TRY** | **79 INR** | **7.90 BRL** |

Our pricing positions Historiq as an affordable Education app, significantly below premium players like Duolingo and Calm, and competitive with budget options like Curiosity Stream. This is intentional: as a new entrant, aggressive pricing drives trial and review volume.

---

## Appendix C: Data Sources and References

- [Apple Developer: In-App Purchase and Subscription Pricing](https://developer.apple.com/help/app-store-connect/reference/pricing-and-availability/in-app-purchase-and-subscriptions-pricing-and-availability/)
- [Apple Developer: Manage Subscription Pricing](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions/)
- [Apple Newsroom: App Store Pricing Upgrade (2022)](https://www.apple.com/newsroom/2022/12/apple-announces-biggest-upgrade-to-app-store-pricing-adding-700-new-price-points/)
- [Apple Developer: Price Updates for Subscriptions](https://developer.apple.com/news/?id=nomqoqfm)
- [World Bank: GDP per Capita PPP](https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.CD)
- [World Bank: PPP Conversion Factors](https://data.worldbank.org/indicator/PA.NUS.PPP)
- [IMF: Implied PPP Conversion Rate](https://www.imf.org/external/datamapper/PPPEX@WEO)
- [World Population Review: Median Income by Country](https://worldpopulationreview.com/country-rankings/median-income-by-country)
- [Wikipedia: GDP PPP per Capita](https://en.wikipedia.org/wiki/List_of_countries_by_GDP_(PPP)_per_capita)
- [X-Rates: Exchange Rates (2026-03-30)](https://www.x-rates.com/table/?from=USD&amount=1)
- [9to5Mac: App Store Alternate Pricing Tiers](https://9to5mac.com/2015/07/09/app-store-pricing-emerging-markets/)

---

*This document should be reviewed quarterly and updated when exchange rates shift more than 15% or when Apple announces pricing tier changes. Next scheduled review: 2026-06-30.*

---

## Yeni Ülkeler — Ek PPP Analizi (2026-03-31)

Bu bölüm, mevcut 26 ülke analizine ek olarak 20 yeni locale için PPP fiyatlandırma analizini içermektedir. Metodoloji Bölüm 2 ile tamamen tutarlıdır.

### Ek Döviz Kurları (2026-03-31)

| Para Birimi | Kod | USD Başına Kur |
|-------------|-----|----------------|
| Norveç Kronu | NOK | ~10.55 |
| Danimarka Kronu | DKK | ~6.73 |
| Yeni Şekel | ILS | ~3.72 |
| Çek Korunası | CZK | ~23.20 |
| Macar Forinti | HUF | ~358.00 |
| Romanya Leyi | RON | ~4.65 |
| Yeni Tayvan Doları | TWD | ~32.50 |
| Hong Kong Doları | HKD | ~7.78 |
| Singapur Doları | SGD | ~1.34 |
| Malezya Ringgiti | MYR | ~4.45 |
| Vietnam Dongu | VND | ~25,000 |
| Ukrayna Grivnası | UAH | ~41.50 |
| Euro (yeni AB ülkeleri) | EUR | 0.8727 (mevcut) |

> Not: Hırvatistan (Ocak 2023'ten itibaren Euro bölgesi) ve Slovakya (2009'dan itibaren Euro bölgesi) EUR kullanmaktadır. Romanya 2026 itibarıyla henüz EUR'a geçmemiş olup RON kullanmaktadır.

---

### Tier 1 — Gelişmiş Pazarlar (Ek)

GDP per capita PPP > $55,000 olan yüksek gelirli ülkeler. US fiyatına %0-20 indirimle yakınsama.

#### PPP Veri Tablosu — Tier 1 Yeni Ülkeler

| Ülke | GDP/Cap PPP ($) | PPP Oranı | Medyan Gelir ($) | Gelir Oranı | Karma Faktör | Son Adj. |
|------|----------------|-----------|-----------------|-------------|--------------|----------|
| Norveç | ~105,000 | 1.22 | ~25,000 | 1.30 | 1.25 | 1.00 (cap) |
| Danimarka | ~78,000 | 0.91 | ~20,500 | 1.06 | 0.97 | 0.95 |
| Finlandiya | ~64,000 | 0.75 | ~17,000 | 0.88 | 0.81 | 0.82 |
| İsrail | ~58,000 | 0.68 | ~14,500 | 0.75 | 0.71 | 0.75 |
| Tayvan | ~75,000 | 0.87 | ~17,000 | 0.88 | 0.88 | 0.88 |
| Hong Kong | ~70,000 | 0.82 | ~16,000 | 0.83 | 0.82 | 0.83 |
| Singapur | ~130,000 | 1.52 | ~28,000 | 1.45 | 1.49 | 1.00 (cap) |

> PPP oranı 1.00'ın üzerindeki ülkeler (Norveç, Singapur) US fiyatıyla sınırlandırılmıştır (fiyat artırımı önerilmez).

#### Fiyat Tablosu — Tier 1 Yeni Ülkeler

| # | Ülke | Para | Aylık | Yıllık | USD Aylık | USD Yıllık | İndirim | Tier |
|---|------|------|-------|--------|-----------|------------|---------|------|
| 27 | **Norveç** | NOK | 42.00 | 209.00 | ~$3.98 | ~$19.81 | 0% | T1 |
| 28 | **Danimarka** | DKK | 27.00 | 134.00 | ~$4.01 | ~$19.91 | 0% | T1 |
| 29 | **Finlandiya** | EUR | 3.29 | 16.99 | ~$3.77 | ~$19.47 | 6% | T1 |
| 30 | **İsrail** | ILS | 11.90 | 59.90 | ~$3.20 | ~$16.10 | 20% | T1 |
| 31 | **Tayvan** | TWD | 120.00 | 599.00 | ~$3.69 | ~$18.43 | 8% | T1 |
| 32 | **Hong Kong** | HKD | 30.00 | 149.00 | ~$3.86 | ~$19.15 | 3% | T1 |
| 33 | **Singapur** | SGD | 5.48 | 26.98 | ~$4.09 | ~$20.13 | 0% | T1 |

**Notlar:**
- **Norveç:** Apple NOK storefrontunda fiyat noktaları mevcuttur. 42.00 NOK, 3.99 USD'ye yakın mükemmel bir eşdeğerdir. Yüksek yaşam maliyeti göz önünde bulundurulduğunda US parity uygundur.
- **Danimarka:** DKK, EUR'a yakın seyretmektedir (yaklaşık sabit kur). 27.00 DKK = ~4.01 USD, US baseline ile hemen hemen eşit.
- **Finlandiya:** EUR kullanmaktadır; 3.29 EUR mevcut 3.49 EUR Tier 1 EUR fiyatının altındadır. Finlandiya'nın GDP'si Fransa/İtalya'ya yakın olduğundan hafif indirimli 3.29 EUR mantıklıdır. Alternatif olarak 3.49 EUR (tam Tier 1) de uygulanabilir.
- **İsrail:** ILS 2024-2025 döneminde jeopolitik baskılar nedeniyle değer kaybetti. 11.90 ILS/ay (~$3.20) %20 indirimle konumlandırılmıştır; makul bir başlangıç noktası.
- **Tayvan:** TWD storefrontunda Apple fiyat noktaları mevcuttur. 120 TWD/ay yaygın bir fiyat noktasıdır.
- **Hong Kong:** HKD, USD'ye yakın seyretmektedir (7.78 civarı). 30.00 HKD = ~$3.86, US parity'e çok yakın.
- **Singapur:** zh-Hans locale kullanıcıları için birincil storefront. SGD güçlü bir paradır; 5.48 SGD/ay US fiyatıyla eşdeğerdir.

---

### Tier 2 — Üst-Orta Pazarlar (Ek)

GDP per capita PPP $25,000-$55,000 arası. %25-55 indirim bandı.

#### PPP Veri Tablosu — Tier 2 Yeni Ülkeler

| Ülke | GDP/Cap PPP ($) | PPP Oranı | Medyan Gelir ($) | Gelir Oranı | Karma Faktör | Son Adj. |
|------|----------------|-----------|-----------------|-------------|--------------|----------|
| Portekiz | ~45,000 | 0.52 | ~10,500 | 0.54 | 0.53 | 0.55 |
| Çekya | ~55,000 | 0.64 | ~12,000 | 0.62 | 0.63 | 0.65 |
| Yunanistan | ~40,000 | 0.47 | ~9,000 | 0.47 | 0.47 | 0.50 |
| Hırvatistan | ~43,000 | 0.50 | ~9,800 | 0.51 | 0.50 | 0.52 |
| Macaristan | ~47,000 | 0.55 | ~10,000 | 0.52 | 0.53 | 0.55 |
| Slovakya | ~49,000 | 0.57 | ~10,500 | 0.54 | 0.56 | 0.58 |
| Malezya | ~35,000 | 0.41 | ~7,500 | 0.39 | 0.40 | 0.42 |

#### Fiyat Tablosu — Tier 2 Yeni Ülkeler

| # | Ülke | Para | Aylık | Yıllık | USD Aylık | USD Yıllık | İndirim | Tier |
|---|------|------|-------|--------|-----------|------------|---------|------|
| 34 | **Portekiz** | EUR | 2.29 | 11.49 | ~$2.62 | ~$13.17 | 34% | T2 |
| 35 | **Çekya** | CZK | 59.00 | 299.00 | ~$2.54 | ~$12.89 | 36% | T2 |
| 36 | **Yunanistan** | EUR | 1.99 | 9.99 | ~$2.28 | ~$11.45 | 43% | T2 |
| 37 | **Hırvatistan** | EUR | 1.99 | 9.99 | ~$2.28 | ~$11.45 | 43% | T2 |
| 38 | **Macaristan** | HUF | 799 | 3,990 | ~$2.23 | ~$11.15 | 44% | T2 |
| 39 | **Slovakya** | EUR | 2.29 | 11.49 | ~$2.62 | ~$13.17 | 34% | T2 |
| 40 | **Malezya** | MYR | 6.90 | 34.90 | ~$1.55 | ~$7.84 | 61% | T2 |

**Notlar:**
- **Portekiz:** EUR kullanmaktadır. İspanya (2.99 EUR) ve Yunanistan (1.99 EUR) arasında konumlandırılmıştır. 2.29 EUR, Apple'ın desteklediği bir fiyat noktasıdır ve Portekiz'in Akdeniz ekonomisi profiliyle uyumludur.
- **Çekya:** CZK kullanmaktadır. 59.00 CZK/ay yaygın bir abonelik fiyat noktasıdır; Çek kullanıcılar bu formatı tanıyacaktır.
- **Yunanistan:** EUR kullanmaktadır. Yunanistan ekonomisi İspanya'dan daha zayıf bir yapıdadır; 1.99 EUR/ay (İspanya'nın 2.99 EUR'unun altında) uygun konumlanmayı sağlar.
- **Hırvatistan:** Ocak 2023'te Euro bölgesine katıldı. Ekonomik profili Yunanistan'a benzer; 1.99 EUR/ay mantıklıdır.
- **Macaristan:** HUF kullanmaktadır. 799 HUF (~$2.23) Apple'ın HUF storefront'undaki fiyat noktasıdır. HUF değer kaybı riskine karşı dikkatli izleme gerekir.
- **Slovakya:** EUR kullanmaktadır (2009'dan beri). Çekya'dan biraz daha yüksek GDP PPP'ye sahip olduğundan Portekizle aynı 2.29 EUR fiyatı uygundur.
- **Malezya:** MYR kullanmaktadır. Güneydoğu Asya'nın en gelişmiş pazarlarından biridir. 6.90 MYR/ay, piyasa normlarıyla tutarlıdır.

---

### Tier 3 — Orta Pazarlar (Ek)

GDP per capita PPP $8,000-$25,000 arası. %50-75 indirim bandı.

#### PPP Veri Tablosu — Tier 3 Yeni Ülkeler

| Ülke | GDP/Cap PPP ($) | PPP Oranı | Medyan Gelir ($) | Gelir Oranı | Karma Faktör | Son Adj. |
|------|----------------|-----------|-----------------|-------------|--------------|----------|
| Romanya | ~40,000 | 0.47 | ~7,500 | 0.39 | 0.43 | 0.45 |
| Vietnam | ~15,000 | 0.17 | ~3,300 | 0.17 | 0.17 | 0.25 |
| Ukrayna | ~16,000* | 0.19 | ~3,200* | 0.17 | 0.18 | 0.25 |

> *Ukrayna için 2022 öncesi veriler kullanılmıştır; savaş etkisiyle fiili satın alma gücü önemli ölçüde azalmıştır. Fiyatlandırma daha muhafazakar tutulmuştur.

> **Not:** Romanya GDP/cap PPP'si ~$40,000 ile teknik olarak Tier 2 sınırına yakındır. Ancak medyan gelir ve yerel uygulama fiyat normları T3 sınırında tutulmayı desteklemektedir. Kullanıcı tabanı genişledikçe T2'ye yükseltme düşünülebilir.

#### Fiyat Tablosu — Tier 3 Yeni Ülkeler

| # | Ülke | Para | Aylık | Yıllık | USD Aylık | USD Yıllık | İndirim | Tier |
|---|------|------|-------|--------|-----------|------------|---------|------|
| 41 | **Romanya** | RON | 8.99 | 44.99 | ~$1.93 | ~$9.68 | 52% | T3 |
| 42 | **Vietnam** | VND | 25,000 | 125,000 | ~$1.00 | ~$5.00 | 75% | T3 |
| 43 | **Ukrayna** | UAH | 39.00 | 189.00 | ~$0.94 | ~$4.55 | 76% | T3 |

**Notlar:**
- **Romanya:** RON kullanmaktadır. GDP/cap PPP ~$40,000 olsa da medyan gelir düşük kalmaktadır. 8.99 RON/ay, yerel referans fiyatlarına (Spotify ~12.99 RON, Netflix ~23.99 RON) göre uygun giriş noktasıdır.
- **Vietnam:** VND kullanmaktadır. Hızla büyüyen Güneydoğu Asya pazarı. 25,000 VND/ay (~$1.00) yerel abonelik normlarıyla uyumludur. Apple Vietnam storefrontunda düşük fiyat noktaları desteklemektedir.
- **Ukrayna:** UAH kullanmaktadır. Savaş döneminin ekonomik baskısı dikkate alındığında 39.00 UAH/ay (~$0.94) ulaşılabilir bir fiyat noktasıdır. Döviz volatilitesine karşı aylık izleme önerilir.

---

### Özel Değerlendirmeler

#### Çin (zh-Hans locale) — Kısıtlı

| Durum | Detay |
|-------|-------|
| App Store | Çin App Store'da (storefront: CHN) uygulama dağıtmak için **Çin'de kayıtlı bir tüzel kişilik veya yerel ortaklık gereklidir.** |
| Yasal Gereksinimler | ICP lisansı, kişisel veri yerelleştirme (PIPL), içerik denetim gereksinimleri uygulanabilir. |
| Öneri | Kısa vadede **Singapur (SGP)** storefront'u zh-Hans kullanıcılara hizmet için yeterli alternatiftir. SGP fiyatı: 5.48 SGD/ay, 26.98 SGD/yıl (bkz. No. 33 yukarıda). |
| Uzun Vade | Çin pazarına giriş için ayrı bir hukuki ve teknik hazırlık planı gereklidir. Bu PPP analizinin kapsamı dışındadır. |

#### Rusya (ru locale) — Mevcut Analiz Geçerli

Mevcut PPP analizindeki Rusya bölümüne bakınız (No. 21, Bölüm 4). Rusya App Store'dan kısıtlı/riskli statüsünü korumaktadır. Yeni analiz gerekmemektedir.

#### Katalonya / İspanya (ca locale) — Mevcut Analiz Geçerli

`ca` locale'i (Katalanca) Apple ekosisteminde ayrı bir App Store storefrontu oluşturmamaktadır. İspanya (ES) storefrontu üzerinden hizmet verilmektedir. İspanya PPP fiyatlandırması mevcut analizde mevcuttur (No. 7: 2.99 EUR/ay, 14.99 EUR/yıl). Yeni analiz gerekmemektedir.

#### İtalya (it locale) — Mevcut Analiz Geçerli

İtalya PPP fiyatlandırması mevcut analizde mevcuttur (No. 6: 3.49 EUR/ay, 17.99 EUR/yıl). Yeni analiz gerekmemektedir.

#### İspanya (es-ES locale) — Mevcut Analiz Geçerli

İspanya PPP fiyatlandırması mevcut analizde mevcuttur (No. 7: 2.99 EUR/ay, 14.99 EUR/yıl). Yeni analiz gerekmemektedir.

---

### Konsolide Özet — Yeni Ülkeler

#### Aylık Abonelik

| # | Ülke | Para | Aylık | Yıllık | USD Aylık | USD Yıllık | İndirim | Tier |
|---|------|------|-------|--------|-----------|------------|---------|------|
| 27 | Norveç | NOK | 42.00 | 209.00 | ~$3.98 | ~$19.81 | 0% | T1 |
| 28 | Danimarka | DKK | 27.00 | 134.00 | ~$4.01 | ~$19.91 | 0% | T1 |
| 29 | Finlandiya | EUR | 3.29 | 16.99 | ~$3.77 | ~$19.47 | 6% | T1 |
| 30 | İsrail | ILS | 11.90 | 59.90 | ~$3.20 | ~$16.10 | 20% | T1 |
| 31 | Tayvan | TWD | 120.00 | 599.00 | ~$3.69 | ~$18.43 | 8% | T1 |
| 32 | Hong Kong | HKD | 30.00 | 149.00 | ~$3.86 | ~$19.15 | 3% | T1 |
| 33 | Singapur | SGD | 5.48 | 26.98 | ~$4.09 | ~$20.13 | 0% | T1 |
| 34 | Portekiz | EUR | 2.29 | 11.49 | ~$2.62 | ~$13.17 | 34% | T2 |
| 35 | Çekya | CZK | 59.00 | 299.00 | ~$2.54 | ~$12.89 | 36% | T2 |
| 36 | Yunanistan | EUR | 1.99 | 9.99 | ~$2.28 | ~$11.45 | 43% | T2 |
| 37 | Hırvatistan | EUR | 1.99 | 9.99 | ~$2.28 | ~$11.45 | 43% | T2 |
| 38 | Macaristan | HUF | 799 | 3,990 | ~$2.23 | ~$11.15 | 44% | T2 |
| 39 | Slovakya | EUR | 2.29 | 11.49 | ~$2.62 | ~$13.17 | 34% | T2 |
| 40 | Malezya | MYR | 6.90 | 34.90 | ~$1.55 | ~$7.84 | 61% | T2 |
| 41 | Romanya | RON | 8.99 | 44.99 | ~$1.93 | ~$9.68 | 52% | T3 |
| 42 | Vietnam | VND | 25,000 | 125,000 | ~$1.00 | ~$5.00 | 75% | T3 |
| 43 | Ukrayna | UAH | 39.00 | 189.00 | ~$0.94 | ~$4.55 | 76% | T3 |

---

### Appendix D: Yeni Ülkeler — PPP Faktör Türetmesi

| Ülke | GDP/Cap PPP ($) | PPP Oranı | Medyan Gelir ($) | Gelir Oranı | Karma Faktör | Son Adj. |
|------|----------------|-----------|-----------------|-------------|--------------|----------|
| Norveç | ~105,000 | 1.22 | ~25,000 | 1.30 | 1.25 | 1.00 (cap) |
| Danimarka | ~78,000 | 0.91 | ~20,500 | 1.06 | 0.97 | 0.95 |
| Finlandiya | ~64,000 | 0.75 | ~17,000 | 0.88 | 0.81 | 0.82 |
| İsrail | ~58,000 | 0.68 | ~14,500 | 0.75 | 0.71 | 0.75 |
| Tayvan | ~75,000 | 0.87 | ~17,000 | 0.88 | 0.88 | 0.88 |
| Hong Kong | ~70,000 | 0.82 | ~16,000 | 0.83 | 0.82 | 0.83 |
| Singapur | ~130,000 | 1.52 | ~28,000 | 1.45 | 1.49 | 1.00 (cap) |
| Portekiz | ~45,000 | 0.52 | ~10,500 | 0.54 | 0.53 | 0.55 |
| Çekya | ~55,000 | 0.64 | ~12,000 | 0.62 | 0.63 | 0.65 |
| Yunanistan | ~40,000 | 0.47 | ~9,000 | 0.47 | 0.47 | 0.50 |
| Hırvatistan | ~43,000 | 0.50 | ~9,800 | 0.51 | 0.50 | 0.52 |
| Macaristan | ~47,000 | 0.55 | ~10,000 | 0.52 | 0.53 | 0.55 |
| Slovakya | ~49,000 | 0.57 | ~10,500 | 0.54 | 0.56 | 0.58 |
| Malezya | ~35,000 | 0.41 | ~7,500 | 0.39 | 0.40 | 0.42 |
| Romanya | ~40,000 | 0.47 | ~7,500 | 0.39 | 0.43 | 0.45 |
| Vietnam | ~15,000 | 0.17 | ~3,300 | 0.17 | 0.17 | 0.25 |
| Ukrayna | ~16,000 | 0.19 | ~3,200 | 0.17 | 0.18 | 0.25 |

---

### ASC CSV Import — Yeni Ülkeler (Ek Blok)

Apple App Store Connect `asc subscriptions pricing import` formatında 3-harf ISO ülke kodlarıyla:

#### Aylık Abonelik

```csv
territory,price,start_date
NOR,42.00,2026-05-20
DNK,27.00,2026-05-20
FIN,3.29,2026-05-20
ISR,11.90,2026-05-20
TWN,120.00,2026-05-20
HKG,30.00,2026-05-20
SGP,5.48,2026-05-20
PRT,2.29,2026-05-20
CZE,59.00,2026-05-20
GRC,1.99,2026-05-20
HRV,1.99,2026-05-20
HUN,799.00,2026-05-20
SVK,2.29,2026-05-20
MYS,6.90,2026-05-20
ROU,8.99,2026-05-20
VNM,25000.00,2026-05-20
UKR,39.00,2026-05-20
```

#### Yıllık Abonelik

```csv
territory,price,start_date
NOR,209.00,2026-05-20
DNK,134.00,2026-05-20
FIN,16.99,2026-05-20
ISR,59.90,2026-05-20
TWN,599.00,2026-05-20
HKG,149.00,2026-05-20
SGP,26.98,2026-05-20
PRT,11.49,2026-05-20
CZE,299.00,2026-05-20
GRC,9.99,2026-05-20
HRV,9.99,2026-05-20
HUN,3990.00,2026-05-20
SVK,11.49,2026-05-20
MYS,34.90,2026-05-20
ROU,44.99,2026-05-20
VNM,125000.00,2026-05-20
UKR,189.00,2026-05-20
```

> **Çin (CHN):** Uygulama dağıtımı için önce Çin App Store gereksinimlerini karşılayın (ICP lisansı, yerel tüzel kişilik). Hazır olduğunda önerilen fiyat: ~18 CNY/ay, ~88 CNY/yıl.
>
> **Rusya (RUS):** Mevcut dosyadaki RU analizi geçerlidir. App Store erişimi yeniden sağlandığında 149 RUB/ay, 749 RUB/yıl.
>
> **İspanya (ESP), İtalya (ITA), Katalonya (ca locale → ESP):** Mevcut CSV bloğundaki değerler geçerlidir (Bölüm 6.2).

---

### Volatilite İzleme — Yeni Ülkeler

Mevcut izleme listesine ek olarak:

| Para Birimi | Risk Seviyesi | İzleme Sıklığı | Not |
|-------------|--------------|----------------|-----|
| UAH (Ukrayna Grivnası) | Çok Yüksek | Aylık | Savaş dönemi volatilitesi; ani değer kayıpları olası |
| HUF (Macar Forinti) | Orta | Çeyreklik | AB üyesi; EUR'a yakınsama beklentisi var |
| RON (Romanya Leyi) | Orta | Çeyreklik | Romanya 2026-2027 döneminde Euro'ya geçiş sürecinde |
| ILS (İsrail Şekeli) | Orta-Yüksek | Çeyreklik | Jeopolitik riskler ILS'yi etkiliyor |
| MYR (Malezya Ringgiti) | Düşük-Orta | Yarıyıllık | Petrol fiyatlarıyla korelasyon |
| VND (Vietnam Dongu) | Düşük | Yarıyıllık | Görece stabil seyretmektedir |
| NOK (Norveç Kronu) | Düşük | Yarıyıllık | Petrol gelirleriyle desteklenen stabil para |
| DKK (Danimarka Kronu) | Çok Düşük | Yıllık | EUR'a yakın sabit bant (±2.25%) |

---

*Bu ek bölüm 2026-03-31 tarihinde oluşturulmuştur. Bir sonraki gözden geçirme tarihi: 2026-06-30 (ana dökümanla eşzamanlı).*
