# Eigenständiges Hosting ohne ChatGPT

Die Variante für GitHub Pages enthält dieselbe React-Oberfläche und dieselben Analysefunktionen wie die private Site. Sie benötigt weder ChatGPT-Anmeldung noch OpenAI-Schlüssel, Cloudflare-Konto, Datenbank-Passwort oder dauerhaft laufenden eigenen Rechner. Die Kursdaten sind über den veröffentlichten Link öffentlich abrufbar. Der Zugang ist kein privater Arbeitsbereich.

## Einmalige Aktivierung

1. Im Repository `markuswand-lgtm/market-atlas` **Settings → Pages → Build and deployment → Source → GitHub Actions** wählen.
2. Unter **Actions → Publish independent Market Atlas** den vorbereiteten Lauf prüfen bzw. nach Aktivierung einen fehlgeschlagenen Deployment-Job erneut ausführen.
3. Nach erfolgreichem Deployment wird die App unter `https://markuswand-lgtm.github.io/market-atlas/` geöffnet. Ohne erfolgreichen Deployment-Lauf ist dieser Link noch nicht live.

## Datenbank und Aktualisierung

`data/bootstrap.json.gz` enthält einen validierten Startbestand aller 32 Quellenreihen mit Quellen-URL und Abrufzeit. Er ermöglicht eine vollständige erste Veröffentlichung auch dann, wenn einzelne Quellen zeitweise nicht erreichbar sind. Es sind ausschließlich Marktdaten enthalten, keine Zugangsdaten oder persönlichen Nutzerangaben. Datenrechte bleiben bei den jeweiligen Quellen; der Code überträgt keine Rechte an Fremddaten. Quellen und Definitionen stehen im Katalog sowie in `docs/historical-sources.md`.

Der GitHub-Workflow lädt täglich um 07:00 Uhr Europe/Berlin die 25 aktiven Reihen; Sommer-/Winterzeit wird bei der Auswahl des UTC-Triggers berücksichtigt. GitHub kann geplante Jobs verzögern. Archivserien bleiben erhalten. Abgerufene Datumswerte aktualisieren vorhandene Beobachtungen, ältere Historie bleibt bestehen. Bei Quellenfehlern bleibt die letzte erfolgreiche Fassung verfügbar und die App zeigt einen Hinweis. Fehlt eine Reihe vollständig, wird nicht veröffentlicht.

Für Dauerhaftigkeit werden der letzte veröffentlichte Datenstand und der GitHub-Actions-Cache wiederverwendet. Zusätzlich bleibt der Startbestand im Repository. Jede Veröffentlichung enthält eine echte **SQLite-Datenbank** (`data/market-atlas.sqlite`) mit Tabellen `series` und `observations`, sowie versionierte JSON-Reihen für schnelle Browserabfragen. Die Datenbank kann in der App heruntergeladen werden. Der Build veröffentlicht alle Dateien gemeinsam; das Manifest referenziert den zugehörigen Snapshot.

„Neueste Daten laden“ lädt die jüngste veröffentlichte Fassung. Ein öffentlicher Browser kann keine zentralen Kursdaten überschreiben oder beliebige Quelldownloads starten. Zum sofortigen Quellenabruf kann der Repository-Eigentümer den GitHub-Workflow manuell ausführen. Der tägliche Job läuft unabhängig von ChatGPT, Codex und der bisherigen privaten Site.

## Lokal prüfen oder zu anderem statischen Hoster übertragen

```sh
npm ci
node scripts/update-static-data.mjs
npm test
npm run typecheck
npm run build:static
npm run preview:static
```

Der fertige Ordner `dist-static/` kann vollständig bei einem beliebigen statischen Hoster bereitgestellt werden. Relative Pfade erlauben sowohl eine eigene Domain als auch ein Unterverzeichnis. Die bisherige Sites-/Worker-Variante bleibt über `npm run build` separat baubar; `build:static` enthält keinen Sites-Proxy und führt keine Aufrufe gegen die private Site aus.

Dokumentation: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [geplante GitHub-Workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
