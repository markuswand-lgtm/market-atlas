# Market Atlas

Deutschsprachige Browser-App für historische Multi-Asset-Analyse, Geldmengen, Inflationsbereinigung und nachvollziehbare Strategietests.

**Browser-App:** https://market-atlas-mw-20261117.workspace-vo-6330.chatgpt.site (privater Zugriff)

**Quellcode:** https://github.com/markuswand-lgtm/market-atlas

**Unabhängige Browser-Version ohne ChatGPT:** Für GitHub Pages vorbereitet. Einmalig unter **Settings → Pages → Source → GitHub Actions** aktivieren; erst nach erfolgreichem Deployment erreichbar unter https://markuswand-lgtm.github.io/market-atlas/. [Betrieb, Datenbank und tägliche Aktualisierung](docs/independent-hosting.md).

## Funktionen

- S&P 500, Dow Jones, DAX, Nasdaq 100, Nikkei 225, Gold-/Silber-Futures, WTI/Brent-Spotpreise.
- Kryptowährungen in USD: Bitcoin, Ethereum, BNB, XRP, Solana, Cardano, Dogecoin, TRON und Chainlink.
- Geldmengen: USD M2, EUR M3 sowie GBP/JPY M3 als ausdrücklich bezeichnete Archivserien.
- Tages-/Monatsdaten über den vollständigen verfügbaren Zeitraum der jeweiligen Quelle; SQLite/D1 mit Quellennachweis und Importprotokoll.
- Mehrere Assets, freie Datumsauswahl, Basis-100-Vergleich, Originalwerte, logarithmische Achse, Tooltip und CSV-Export.
- Frei begrenzte lineare/log-lineare Regression mit R².
- Inflationsknopf: US-CPI oder Euro-HVPI, exakte Monatszuordnung und sichtbarer Basismonat.
- Digitalisierte Jahresangaben des bereitgestellten Zyklusbilds, optional im Kursdiagramm; Originalbild und Unstimmigkeiten bleiben nachvollziehbar.
- SMA-Long/Cash-Strategie mit Folgetagsausführung, Handelskosten und Buy-&-Hold-Vergleich.
- Automatische tägliche Quellenprüfung um 07:00 Uhr (Europe/Berlin), auch bei geschlossenem Browser; Details: [Automatische Aktualisierung](docs/automatic-updates.md).
- MAX-Zeitachse ab 1890, mit sichtbaren Datenlücken vor Beginn der jeweiligen Quelle. Basis 100 erhält standardmäßig jede Historie; gemeinsamer Start ist optional.
- Strategielabor folgt der Asset-Auswahl und berechnet gestartete Tests bei Änderungen an Parametern, Zeiträumen und Daten neu. Fehlende Aufwärmhistorie verschiebt den tatsächlichen Testbeginn sichtbar.

- Acht zusätzliche Langzeitreihen: US-Aktien und CPI ab 1871, deutsche Aktien ab 1870, früher Dow, Gold ab 1850, Silber ab 1833 und Öl ab 1859. [Quellen und Unterschiede](docs/historical-sources.md).
- SMA-Erklärung und einstellbare Parametersuche mit Kosten, gemeinsamem Trainingsfenster und anschließendem Prüfzeitraum. [Methodik der Optimierung](docs/sma-optimization.md).

## Lokal starten

Node.js **24 LTS** empfohlen (mindestens 22.13 für die App; die Archivskripte verwenden integriertes TypeScript-Stripping und `node:sqlite`).

```sh
npm ci
npm test
npm run typecheck
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_familiar_terrax.sql
npm run dev
```

Die Konsole zeigt die lokale URL (normalerweise http://localhost:5173). **Datenbank → Alle Historien laden** befüllt die Browser-App-Datenbank. Migrationen nur einmal je lokaler Datenbank anwenden; weitere Migrationen in Dateireihenfolge.

## Daten herunterladen

```sh
npm run data:download
```

Schreibt `work/data/market-atlas.sqlite`, CSV-/JSON-Dateien für alle 32 Reihen und ein Quellenmanifest. Diese Rohdaten werden **nicht in Git eingecheckt**. Die App-Datenbank und dieses exportierbare SQLite-Archiv sind getrennte Speicher. Der folgende Befehl importiert das heruntergeladene Archiv über die App-API:

```sh
node scripts/import-archive.mjs http://localhost:5173
```

Bei der Eingabeaufforderung `{}` und Enter für localhost eingeben. Für eine private veröffentlichte Site wird ein bereits bereitgestellter Servicezugang ausschließlich über stdin übergeben (`{"token":"…"}`); niemals Token in Quellcode, Shellargumente, Git oder Logs schreiben. Die normale Nutzung im Browser benötigt keinen solchen Token.

## Architektur

React + TypeScript + Vinext/Vite, Cloudflare Worker, D1/SQLite und Drizzle-Migrationen. Die persistente D1-Datenbank speichert Beobachtungen und Importläufe. Lokale und veröffentlichte Datenbanken sind unabhängig. Hosted Site bleibt owner-private; vor einer öffentlichen oder Mehrbenutzer-Bereitstellung sind anwendungsseitige Schreibrechte und Rate Limits erforderlich.

```text
app/                 Oberfläche und HTTP-API
components/          SVG-Diagramm und Zyklusdarstellung
lib/catalog.ts       Instrumente, Quellen, Einheiten und Definitionen
lib/providers.ts     Validierte Yahoo/FRED/EZB-Adapter
lib/analytics.ts     Kennzahlen, Deflation, Regression, Backtest
lib/cycles.ts        Bildtranskription
db/ + drizzle/       Datenmodell und Migration
scripts/             Entwicklung, Download und Import
tests/               Rechen- und Parserprüfungen
docs/                Methodik und Entwicklungsfahrplan
```

## Quellen und Grenzen

[Yahoo Finance](https://finance.yahoo.com/), [Federal Reserve/FRED M2](https://fred.stlouisfed.org/series/M2SL), [BLS/FRED CPI](https://fred.stlouisfed.org/series/CPIAUCSL), [EZB M3](https://data.ecb.europa.eu/data/datasets/BSI/BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E), [Eurostat/EZB HVPI](https://data.ecb.europa.eu/data/datasets/HICP/HICP.M.U2.N.000000.4D0.INX), [EIA/FRED WTI](https://fred.stlouisfed.org/series/DCOILWTICO). Weitere Serienlinks stehen im Datenkatalog und in der App.

„Vollständig“ bezieht sich auf die abgerufene Quelle, nicht auf alle weltweit verfügbaren historischen Daten. Keine synthetischen Ersatzkurse. GBP/JPY-Reihen enden 2023. Gold/Silber sind Futures-, Öl ist eine Spotreihe. Daten können revidiert werden; noch keine Vintage-Datenbank. Die Inflationsbereinigung ist eine ex-post Kaufkraftdarstellung ohne FX-Konvertierung. Das Bild enthält eine historische Zyklusthese, keine belastbare Prognose.

Details: [Methodik](docs/methodology.md), [Weiterentwicklung](docs/roadmap.md). Fremddatenrechte verbleiben bei ihren Quellen. Für die unabhängige Bereitstellung enthält `data/bootstrap.json.gz` einen Startbestand mit Quellen- und Abrufnachweis. Die übrigen lokalen Rohdateien bleiben von Git ausgeschlossen.
