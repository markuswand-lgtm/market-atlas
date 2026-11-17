# Automatische Aktualisierung

Die mit der privaten Site verknüpfte Cloud-Aufgabe prüft alle 25 aktiven Katalogreihen täglich um 07:00 Uhr in Europe/Berlin, auch bei geschlossenem Browser. Quellen: Yahoo Finance, FRED, EZB, Shiller und EIA gemäß `lib/catalog.ts`. Verfügbarkeit und Veröffentlichungsrhythmus der Quellen begrenzen die Aktualität. Die 2023 eingestellten GBP/JPY-Serien bleiben historische Archive und sind von täglichen Abrufen ausgenommen; ihre FRED-Endpunkte lieferten beim Produktionstest HTTP 520. Ein manueller Abruf bleibt möglich. Die neuen NBER-Historien und die geprüfte NMA-Goldfassung bleiben ebenfalls Archivbestände; Shiller-Kurse/-CPI und EIA-Rohöl werden automatisch geprüft. Das Manifest liefert die aktiven IDs dynamisch.

## Unbeaufsichtigter Schreibweg

1. Die im Auftrag verknüpfte Site mit dem Sites-Connector `get_site` auflösen. Bestehenden Site-Servicezugang verwenden; keinen neuen Token erzeugen. Nur im Arbeitsspeicher halten, niemals in Dateien, Logs oder Shellargumente schreiben. Der Servicezugang benötigt keine Besuchersitzung oder App-Einwilligung. Die Site bleibt owner-private.
2. Mit Header `OAI-Sites-Authorization: Bearer <bereitgestellter Servicezugang>` die veröffentlichte URL `/api/refresh` per GET lesen. Sie liefert den aktuellen Katalog und das Protokoll, damit die Aufgabe keine lokale Installation benötigt.
3. Für jede ID nacheinander POST `/api/refresh` mit JSON `{ "id": "..." }`. Der Worker lädt und validiert die Quelle selbst. Wiederholen, solange `remaining > 0`. Maximal 100 Aufrufe pro Reihe; danach als unvollständig melden.
4. Vorübergehende Fehler höchstens zweimal mit 5 bzw. 15 Sekunden Abstand wiederholen, danach weitere Reihen bearbeiten. Keine Quellendaten erfinden und erfolgreiche Reihen nicht erneut voll importieren.
5. GET `/api/data` zurücklesen: `status=ready`, Anzahl und Zeitraum dürfen nicht schrumpfen, Abrufzeitpunkt muss für erfolgreiche Reihen zum aktuellen Lauf passen. Fehler und unvollständige Reihen konkret melden. Routineaktualisierungen benötigen kein Deployment.

Der Writer vergleicht sämtliche verfügbaren Quelldaten und speichert höchstens 600 neue oder revidierte Beobachtungen je Transaktion. Eine Datenbank-Lease schützt vor konkurrierenden Importen; Wiederholung ist idempotent. Fehlgeschlagene Downloads lassen die gespeicherten Historien unverändert. Fehlende oder laufend importierte Reihen benötigen zunächst einen vollständigen Import über die bestehende Datenbankansicht.

Die geöffnete App prüft das Datenbankmanifest alle 60 Sekunden und beim Fensterfokus. Änderungen laden aktive Reihen neu; ein gestarteter Backtest wird mit dem gewählten Asset, aktuellen Daten und Parametern neu berechnet.
