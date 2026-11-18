# Ergänzte Langzeithistorien und Herkunft

## Neue Anbieterreihen

**MSCI World, USD Price Return:** Yahoo-Ticker `^990100-USD-STRD`; geprüfter Abruf vom 18.11.2026 enthält 14.050 Tagesbeobachtungen ab 03.01.1972. Damit sind Werte vor 2000 verfügbar. Es ist ein Kursindex ohne Dividenden, kein ETF. MSCI nennt den 31.03.1986 als Indexstart und bezeichnet davor liegende Indexhistorien als rückgerechnet. Die Herkunftsansicht unterscheidet diese Anbieter-Rückrechnung vom späteren Abschnitt. [MSCI-Factsheet](https://www.msci.com/documents/10199/255599/msci-world-index.pdf), [Anbieterhistorie](https://finance.yahoo.com/quote/%5E990100-USD-STRD/history/).

**Silber, Weltbank Pink Sheet:** 802 Monatswerte von Januar 1960 bis Oktober 2026; nominale USD je Feinunze, Quellen-/Benchmarkdefinition im Blatt Description. Nur abgeschlossene Monate. Der Download sucht den aktuellen Workbook-Link auf der offiziellen Commodity-Markets-Seite; der zuletzt bekannte offizielle Link dient als Ersatz, gespeicherte Historie bleibt bei Ausfällen erhalten. [Offizielle Quelle](https://www.worldbank.org/en/research/commodity-markets).

## Acht separate Langzeitmodelle

| Ergänzte Reihe | Vergleichsquelle im früheren Abschnitt | Modell bis | Danach |
|---|---|---|---|
| MSCI World | Shiller US-Aktien ab 1871 | 1971 | MSCI-Anbieterhistorie ab 1972 |
| S&P 500 | Shiller/Cowles/S&P-Monatsmittel ab 1871 | November 1927 | S&P-Anbieterhistorie |
| Dow Jones | Breiter US-Aktienproxy Shiller ab 1871 | 1991 | Dow-Anbieterhistorie ab 1992 |
| Nasdaq 100 | Breiter US-Aktienproxy Shiller ab 1871 | September 1985 | Nasdaq-100-Anbieterhistorie |
| Gold | NMA London-Jahresmittel ab 1850 | 1999 | Gold-Futures, Jahresendwerte |
| Silber | Weltbank-Monatswerte ab 1960 | Juli 2000 | Silber-Futures, Monatsendwerte |
| WTI | EIA US-Erstkaufpreis, Jahresmittel ab 1859 | 1985 | WTI-Spot, Jahresendwerte |
| Brent | EIA US-Erstkaufpreis, Jahresmittel ab 1859 | 1986 | Brent-Spot, Jahresendwerte |

Grenzen werden aus den tatsächlich verfügbaren Quellen berechnet; diese Tabelle dokumentiert den initialen Stand. Die acht Reihen sind ausdrücklich separate Näherungsmodelle. Originalreihen werden nicht geändert. Die Modelle sind monatlich oder jährlich und stehen daher nicht als handelbare Tagesdaten im Strategielabor zur Verfügung.

## Berechnung

1. Anbieter- und Vergleichsreihe auf die langsamere gemeinsame Frequenz bringen, ohne Auffüllen.
2. Erste gemeinsame positive Periode als Anker bestimmen.
3. Faktor = Anbieterwert / Vergleichswert in dieser Periode.
4. Nur **vor** der ersten Anbieterperiode: vorhandene Vergleichswerte mit dem Faktor multiplizieren.
5. Ab Anbieterbeginn unveränderte, auf Monats-/Jahresfrequenz verdichtete Anbieterwerte verwenden. Keine Lückenfüllung innerhalb einer Reihe.

Ankerdatum, beide Ankerwerte, Faktor, Eingangsreihen und deren Abrufzeiten werden im JSON-Archiv gespeichert. Pro Modell werden frühere und spätere Quellenabschnitte sowohl im Manifest als auch in der SQLite-Tabelle `provenance` archiviert. Der tägliche Job berechnet die Modellreihen nach Aktualisierung der Eingangsquellen vollständig neu.

**Annahme und Grenze:** Vor dem Anker wird dieselbe relative Entwicklung wie bei der Vergleichsreihe unterstellt. Das ist eine bewusst einfache Ex-post-Näherung, keine statistisch validierte Rekonstruktion eines unbekannten Index. Insbesondere bildet ein US-Aktienproxy weder frühere Weltmarktgewichte noch einen historischen Technologieindex ab. Die bestehenden eigenständigen Dow-Archivserien bleiben verfügbar; sie werden nicht über die Lücke 1969–1991 zu scheinbaren Originalkursen verbunden. Unterschiedliche Monatsmittel, Jahresmittel, Stichtagswerte, Spot-/Futuresdefinitionen und Kontraktwechsel bleiben methodische Unterschiede. Keine erfundenen Kurse vor der Existenz von Kryptowährungen; für DAX und Nikkei wird ohne passende frühere Anschlussquelle keine zusätzliche Reihe erzeugt.

## Datenbank: Herkunft & Zeitachse

Umschalten zwischen Tabelle und Herkunftsansicht. Zeitbänder pro Asset, Suchfilter, Gruppen und Modellfilter. Legende: Anbieterwerte (blau), historische Quellen/Vorgängerreihen (grün), Rückrechnung des Indexanbieters (violett), eigenes Näherungsmodell (orange schraffiert). Ein Klick zeigt Quellenlink, Anfang/Ende, Frequenz und Methode mit Ankerfaktor. Leere Bereiche bedeuten fehlende dokumentierte Abdeckung; Balken garantieren keine lückenlose Beobachtung innerhalb des Abschnitts.
