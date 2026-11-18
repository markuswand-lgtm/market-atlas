# Registrierung und Login

## Status

Die Implementierung ist vorbereitet. Die produktive Aktivierung erfordert ein mit dem Eigentümer verbundenes Firebase-Projekt. Solange die Repository-Variable `MARKET_ATLAS_FIREBASE_CONFIG` fehlt, bleibt die bestehende öffentliche App aktiv. Ein fehlender Anmeldedienst wird nicht als funktionierender Login ausgegeben.

## Verhalten

Jeder kann sich mit E-Mail und Passwort registrieren. Der Zugang wird erst nach Bestätigung der E-Mail-Adresse freigegeben. Die Oberfläche bietet Login, erneuten Versand der Bestätigung, Passwort-Zurücksetzen und Abmelden. Die Sitzung ist auf den Browser-Tab begrenzt. Passwörter werden ausschließlich an Firebase Authentication übermittelt, nicht im GitHub-Repository oder in der Kursdatenbank gespeichert. Für neue Passwörter fordert die Oberfläche mindestens 12 Zeichen; dieselbe Mindestlänge muss serverseitig als Firebase-Passwortrichtlinie konfiguriert werden.

Die Anmeldung ist unabhängig von ChatGPT und GitHub. Firebase Authentication prüft Identitäten; Realtime Database prüft bei jedem Datenabruf den signierten Benutzer-Token samt `email_verified`. Besucher können keine zentralen Daten schreiben. Das Registrieren eines Kontos verleiht keine Administrationsrechte.

## Produktiv einrichten

1. Firebase-Projekt und Web-App im Eigentümerkonto anlegen, ohne kostenpflichtigen Tarif zu aktivieren. Authentication → E-Mail/Passwort aktivieren; Passwortlänge mindestens 12 Zeichen erzwingen und Schutz vor E-Mail-Aufzählung aktivieren. E-Mail-Vorlagen deutsch konfigurieren. Unter autorisierten Domains `markuswand-lgtm.github.io` hinzufügen.
2. Realtime Database anlegen. Regeln aus `firebase/database.rules.json` einspielen. Keine öffentlichen Testregeln verwenden.
3. GitHub Repository-Variable `MARKET_ATLAS_FIREBASE_CONFIG` auf die öffentliche Web-Konfiguration setzen: `apiKey`, `authDomain`, `projectId`, `databaseURL`, `appId`. Keine Service-Account-Schlüssel in diese Variable eintragen; der Build weist zusätzliche Felder zurück. Der Firebase-Web-API-Key ist eine öffentliche Projektkennung und ersetzt keine Zugriffskontrolle.
4. Ein auf die benötigte Firebase-Datenbank begrenztes Upload-Dienstkonto bereitstellen. JSON-Schlüssel nur im GitHub-Actions-Secret `FIREBASE_SERVICE_ACCOUNT` hinterlegen, niemals in Code, Chat, Logs oder öffentliche Dateien. Optional kann später Workload Identity Federation statische Schlüssel ersetzen.
5. `Publish independent Market Atlas` ausführen. Der Workflow prüft die installierten Datenbankregeln, veröffentlicht Daten und Manifest atomar in Firebase und entfernt alle Daten-JSONs sowie SQLite aus dem Pages-Ausgabeordner. Bei fehlenden Zugangsdaten oder abweichenden Regeln wird die Veröffentlichung abgebrochen.
6. Ohne Anmeldung und mit unbestätigter E-Mail müssen Datenbankabrufe scheitern. Mit bestätigtem Konto müssen Charts und SQLite-Download funktionieren. Schreibversuche normaler Konten müssen scheitern. Danach Registrierung, Bestätigung, Zurücksetzen und Abmelden live prüfen.

Es bleiben maximal drei Daten-Snapshots für laufende Browsersitzungen erhalten. GitHub Actions lädt täglich neue Quelldaten; der Nutzerbrowser darf nur lesen. Der Zugriff auf das Manifest wird regelmäßig aktualisiert.

Das GitHub-Repository und die vor Einrichtung veröffentlichten Marktquellen bleiben öffentlich. Login schützt den laufenden App-Datenzugang, macht zuvor veröffentlichte Daten oder öffentlich verfügbare Originalquellen aber nicht rückwirkend geheim. Benutzerprofile oder persönliche Portfolios werden aktuell nicht gespeichert.

Referenzen: [Firebase Passwort-Authentifizierung](https://firebase.google.com/docs/auth/web/password-auth), [E-Mail-Bestätigung und Zurücksetzen](https://firebase.google.com/docs/auth/web/manage-users), [Datenbankregeln](https://firebase.google.com/docs/database/security).
