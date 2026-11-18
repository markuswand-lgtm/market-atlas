# Registrierung und Login

Market Atlas verwendet Firebase Authentication und eine geschützte Realtime Database. Die Registrierung ist für alle offen; Zugriff auf Analysen und Downloads setzt eine bestätigte E-Mail-Adresse voraus. Die App bleibt unabhängig von ChatGPT und GitHub-Konten.

## Benutzen

1. [Market Atlas öffnen](https://markuswand-lgtm.github.io/market-atlas/).
2. „Neues Konto erstellen“ wählen und E-Mail-Adresse sowie ein eigenes Passwort mit mindestens zwölf Zeichen eingeben.
3. Den Link in der Bestätigungs-E-Mail öffnen; bei Bedarf den Spamordner prüfen.
4. In Market Atlas „Ich habe meine E-Mail bestätigt“ wählen und anmelden.

Login, erneuter Versand der Bestätigung, Passwortzurücksetzung und Abmelden sind integriert. Die Sitzung verwendet den Sitzungsspeicher des Browser-Tabs. Firebase prüft die Passwortrichtlinie auch serverseitig; E-Mail-Aufzählungsschutz ist eingeschaltet. Passwörter werden ausschließlich an Firebase Authentication übermittelt, nicht im GitHub-Repository oder in der Marktdatenbank gespeichert. E-Mail-Aktionen werden vom Browser mit deutscher Sprachkennung angefordert.

## Zugriff und Betrieb

- Projekt: `market-atlas-mw-20261118`, Web-App „Market Atlas Web“.
- Oberfläche: GitHub Pages unter der bisherigen Adresse.
- Realtime Database: `europe-west1` (Belgien). Dies bezeichnet die Datenbankregion, keine regionale Zusage für sämtliche Authentication-Dienste.
- Autorisierte Domains: die beiden Firebase-Projektdomains und `markuswand-lgtm.github.io`.
- Öffentliche Web-Konfiguration: `firebase/web-config.json`. Der dortige API-Key identifiziert das Projekt; er ist kein Verwaltungsgeheimnis. Zugriff wird durch signierte Benutzer-Tokens und serverseitige Regeln geprüft.
- Regeln: `firebase/database.rules.json`. Nur bestätigte Konten dürfen Manifest, einzelne Serien und SQLite-Daten lesen. Besucher dürfen nirgendwo schreiben; interne Veröffentlichungsmetadaten und vollständige Root-Abfragen bleiben gesperrt.

Der tägliche GitHub-Job authentifiziert sich über Workload Identity Federation. Es wurden keine dauerhaften Service-Account-Schlüssel erstellt. Die Föderation verlangt Repository-ID `1461364714`, Eigentümer-ID `230622132`, Branch `main`, genau `.github/workflows/pages.yml` und die Ereignisse `push`, `schedule` oder `workflow_dispatch`. Das Dienstkonto `market-atlas-publisher` besitzt ausschließlich `firebasedatabase.instances.get` und `firebasedatabase.instances.update`; keine Benutzerverwaltung und keine Berechtigung zum Löschen einer Datenbankinstanz.

Vor jedem Quellenabruf stellt `scripts/restore-firebase-data.mjs` den letzten geschützten Snapshot wieder her. Dadurch bleibt die Historie auch bei einem leeren GitHub-Cache erhalten. Danach werden vollständige neue Snapshots in begrenzten Schreibvorgängen hochgeladen. Das öffentliche Manifest im geschützten Datenpfad wird erst nach abgeschlossenem Upload atomar umgestellt; drei erfolgreiche Snapshots bleiben verfügbar. SQLite wird in kleinen Base64-Blöcken übertragen und beim Download auf Länge und SHA-256-Prüfsumme geprüft.

Vor Veröffentlichung prüft der Publisher die tatsächlich installierten Regeln gegen die Datei im Repository. Fehlende Zugangsdaten, abweichende Regeln und fehlerhafte Uploads brechen das Deployment ab. Erst nach erfolgreicher Veröffentlichung werden Daten-JSONs und SQLite aus `dist-static/data` entfernt. GitHub Pages liefert ausschließlich die Oberfläche; aktuelle App-Daten kommen aus Firebase.

## Einrichtung nachvollziehen

Die Firebase-Verbindung und die Provider sind bereits eingerichtet. `firebase.json` und `.firebaserc` enthalten die reproduzierbare Zuordnung für Regeln und E-Mail/Passwort-Provider. Die zusätzliche Passwortrichtlinie und Domains liegen in Firebase Authentication. Eine optionale GitHub-Variable `MARKET_ATLAS_FIREBASE_CONFIG` kann die öffentliche Web-Konfiguration überschreiben, muss aber zum Publisher-Projekt passen.

Bei einem Fork ein eigenes Firebase-Projekt, eigene Regeln und einen auf das neue Repository beschränkten Workload-Identity-Provider einrichten. Keine privaten Schlüssel oder Benutzer-Tokens in Quellcode, Logs oder öffentliche Dateien übernehmen. Es wurde kein kostenpflichtiger Tarif aktiviert; die vom Anbieter bereitgestellten Kontingente gelten.

## Verifiziert

Am 18. November 2026 mit einem anschließend entfernten Testkonto am echten Dienst geprüft: Registrierung, serverseitige Passwortmindestlänge, E-Mail-Bestätigungslink, Anmeldung, Abmeldung, Passwortzurücksetzung, bestätigte Daten-/SQLite-Lesezugriffe, abgewiesene anonyme/unbestätigte Zugriffe und gesperrte Schreibversuche. Die Linkaktionen wurden ohne Versand an ein echtes Postfach getestet; die tatsächliche E-Mail-Zustellung hängt vom empfangenden Mailanbieter ab.

Das Repository und vor der Login-Einrichtung veröffentlichte Marktquellen bleiben öffentlich. Der Login schützt den laufenden App-Datenzugang und macht zuvor veröffentlichte Daten oder Originalquellen nicht rückwirkend geheim. Persönliche Portfolios werden derzeit nicht gespeichert.

Referenzen: [Firebase Passwort-Authentifizierung](https://firebase.google.com/docs/auth/web/password-auth), [E-Mail-Aktionen](https://firebase.google.com/docs/auth/web/manage-users), [Datenbankregeln](https://firebase.google.com/docs/database/security), [Workload Identity für GitHub](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).
