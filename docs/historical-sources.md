# Historische Quellen vor 1890

Die Ansicht **Langzeithistorien** zeigt tatsächliche historische Beobachtungen auf derselben Kalenderachse. Eigenständige Reihen verhindern, dass andere Indexdefinitionen, Jahresmittel oder Rohstoffkontrakte unbemerkt miteinander verkettet werden. Quellen geprüft am 17. November 2026.

| Reihe | Gespeicherter Umfang | Frequenz | Primärquelle |
|---|---|---|---|
| US-Aktien / Shiller | 1871-01–2026-10, 1.870 Werte | Monatsmittel täglicher Schlusskurse | [Robert J. Shiller](https://shillerdata.com/) |
| Deutsche Aktien | 1870-01–1913-12, 528 Werte | monatlich | [NBER/FRED M1123ADEM324NNBR](https://fred.stlouisfed.org/series/M1123ADEM324NNBR) |
| Dow Jones, 12 Aktien | 1897-01–1916-09, 233 Werte | Monatsmittel aus Hoch/Tief | [NBER/FRED M1109AUSM293NNBR](https://fred.stlouisfed.org/series/M1109AUSM293NNBR) |
| Dow Jones, 20/30 Aktien | 1914-12–1968-12, 649 Werte | monatlich | [NBER/FRED M1109BUSM293NNBR](https://fred.stlouisfed.org/series/M1109BUSM293NNBR) |
| Gold, London/USD | 1850–2024, 175 Werte | Jahresmittel | [NMA, geprüfte PDF-Tabelle](https://nma.org/wp-content/uploads/2024/01/his_gold_prices_1833_pres_2024.pdf) |
| Silber, London | 1833–1933, 101 Werte | jährlich | [NBER/US Mint/FRED A04018GB00LONA286NNBR](https://fred.stlouisfed.org/series/A04018GB00LONA286NNBR) |
| US-Rohöl, Erstkaufpreis | 1859–2025, 167 Werte | Jahresmittel | [U.S. EIA](https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?f=A&n=PET&s=F000000__3) |
| US-Preisindex / Shiller | 1871-01–2026-09, 1.869 Werte | monatlich | [Shiller, Warren–Pearson/BLS](https://shillerdata.com/) |

Kontrollwerte aus 1890: Shiller Januar 5,38 Indexpunkte, Gold 18,94 USD/Feinunze, Silber 1,046 USD/Feinunze, US-Rohöl 0,77 USD/Barrel. Dies sind Quellenbeobachtungen, keine künstliche Rückrechnung in der App.

## Definitionen und Grenzen

- Shillers ursprüngliche [Yale-Seite](http://www.econ.yale.edu/~shiller/data.htm) verlinkt auf die neue offizielle Website. Der Adapter löst dort den aktuellen XLS-Link auf; SheetJS 0.20.3 stammt vom offiziellen CDN. Preiswerte vor dem modernen S&P 500 sind Cowles-/S&P-Vorgängerreihen. Der laufende Monat bleibt ausgeschlossen. Die neuesten zwei Quellenmonate des CPI werden vorsorglich ausgelassen, weil die aktuelle Fußnote Oktober/November als Schätzwerte bezeichnet. Vor 1913 verwendet die Quelle einen angeketteten Warren–Pearson-Preisindex.
- Deutsche Aktien sind kein DAX: ungewichteter Index bis 1889, breiterer gewichteter Index ab 1890. Die Quelle endet 1913.
- Die frühen Dow-Reihen unterscheiden sich in Zusammensetzung und Skalierung. Sie werden trotz Überlappung nicht zusammengefügt. Vier fehlende Monate 1914 bleiben fehlend; das Diagramm unterbricht historische Monatslinien bei größeren Lücken.
- NMA-Gold ist eine London/USD-Kompilation mit Quellenwechseln. Das Sammelintervall 1833–1849 wird nicht in Einzeljahre aufgeteilt. Auffällige Werte 1931=17,06 und 1949=31,69 wurden im Originalbild bestätigt und bleiben unverändert. Das PDF enthält eine widersprüchliche Fußnoten-Jahresangabe; die Quelle wird nicht still korrigiert.
- Silber wurde aus Londoner Feinheits-/Währungsdefinitionen umgerechnet. Regimewechsel 1931/1933; die letzte Beobachtung bezeichnet das Fiskaljahr 1932/33.
- EIA-Erstkaufpreise sind weder WTI noch Brent. Die XLS-Datei beginnt erst 1900; deshalb liest der Adapter die verifizierte vollständige HTML-Tabelle ab 1859.
- Jahresdaten verwenden den 1. Januar nur als Zeichnungsschlüssel. Sie sind keine Januarkurse. Die Inflationsbereinigung verwendet näherungsweise den CPI-Jahresdurchschnitt aus zwölf vorhandenen Monaten. Fehlende Monate führen zum Auslassen des Jahres.
- SMA-Strategietests verwenden tägliche Schlusskurse. Monats-/Jahresdurchschnitte werden nicht als handelbare Schlusskurse ausgegeben. Moderne Indizes und Kryptowährungen werden nicht vor ihre Entstehung zurückverlängert.

## Aktualisierung und Reproduktion

Shiller (Kurse und CPI) sowie EIA sind im vorhandenen täglichen Aktualisierungsmanifest enthalten. NBER-Archive und die geprüfte NMA-PDF-Fassung bleiben Archivbestände. Die tägliche Cloud-Aufgabe liest die aktiven IDs dynamisch; kein neuer Zeitplan nötig.

```sh
npm run data:download -- shiller-stock shiller-cpi germany-stock dow-early dow-historical silver-historical oil-historical
python -m pip install pypdf
python scripts/download-gold-history.py
npm run data:download -- gold-historical
node scripts/import-archive.mjs http://localhost:5173 shiller-stock shiller-cpi germany-stock dow-early dow-historical gold-historical silver-historical oil-historical
```

Bei lokalem Import `{}` über stdin eingeben. Gehosteter privater Import verwendet den bestehenden Servicezugang ausschließlich über versteckte stdin. Rohdateien, CSV, JSON und SQLite bleiben unter ignoriertem `work/data/`; keine Fremddaten im öffentlichen GitHub-Repository. EIA-Daten sind [Public Domain mit gewünschter Quellenangabe](https://www.eia.gov/about/copyrights_reuse.php). Für Shiller/NMA wurde keine ausdrückliche offene Weiterverbreitungslizenz gefunden; NBER/FRED verlangt Quellenangabe. Private Datenhaltung und Attribution bleiben erhalten.
