# SMA und Parametersuche

SMA bedeutet **Simple Moving Average**, einfacher gleitender Durchschnitt. Für ein Fenster mit n Beobachtungen ist der Wert die Summe der letzten n Schlusskurse geteilt durch n. Alle Werte haben gleiches Gewicht. Ein kürzeres Fenster reagiert früher, ein längeres glättet stärker. Siehe [Fidelity: SMA](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/sma).

Die App verwendet ein Long-/Cash-Modell, keine automatische Orderausführung. Das Signal nach Schlusskurs t−1 wird am Schluss t ausgeführt; Rendite erst danach. Fenster zählen Kursbeobachtungen: Aktienhandelstage, bei Kryptowährungen auch Wochenenden. Monats-/Jahresmittel gehören zur Analyse und werden nicht in diesen Ausführungstest aufgenommen.

## Optimierung

Im Strategielabor gelten die Schnellwahlen 1J, 5J, 10J, 20J und MAX sowie freie Von-/Bis-Daten für Backtest und Suche. „Basis 100“ normiert Strategie und Buy & Hold im Backtest sowie im getrennten Prüfdiagramm jeweils am eigenen Abschnittsanfang auf 100. „Originalbetrag“ zeigt simuliertes Modellkapital in USD, beim DAX EUR und beim Nikkei JPY. Die Umschaltung verändert weder Renditen noch Optimierungsrangfolge und führt keine Inflationsbereinigung durch. CSV-Backtests behalten die ursprünglichen Kapitalwerte.

Der Nutzer wählt Grenzen und Schrittweiten für schnelle/langsame Fenster. Nur `2 ≤ schnell < langsam ≤ 1000`, maximal 2.500 Kombinationen. Default: schnell 10–100 in Zehnerschritten, langsam 50–400 in 25er-Schritten; 70 % Training, 30 % anschließende Prüfung. Mindestens 60 Trainings- und 30 Prüfbeobachtungen nach gemeinsamem Aufwärmen.

Alle Kandidaten beginnen am selben Tag, nach der größten getesteten SMA-Länge. So wird kein Kandidat durch einen kürzeren oder anderen Bewertungszeitraum bevorzugt. Kosten und Anfangskapital entsprechen dem Backtest. Wahlweise wird die CAGR nach Kosten maximiert oder `CAGR − |maximaler Rückgang|`. Der zweite Wert ist ein transparentes kombiniertes Ziel, kein standardisierter Sharpe- oder Calmar-Quotient. Gleichstand: kleinerer absoluter Rückgang, danach kleinere Fenster.

Die Rangfolge verwendet ausschließlich das frühere Trainingssegment. Erst nach Auswahl wird genau der Gewinner auf dem späteren, chronologisch getrennten Prüfsegment berechnet. Aufwärmhistorie vor dessen Beginn ist zulässig; Prüfpreise beeinflussen die Auswahl nicht. Beide Abschnitte beginnen unabhängig mit Cash und berücksichtigen Einstiegs-/Schlusskosten. Die zehn besten Trainingskandidaten und der Gewinner im Prüfzeitraum werden getrennt angezeigt. „Werte in Backtest übernehmen“ ändert die beiden SMA-Felder; der normale Backtest bewertet dann wieder den gesamten gewählten Zeitraum und ist entsprechend kein separater Holdout.

„Optimal“ bedeutet bestes Ergebnis im gewählten Raster, nach Ziel und Trainingsdaten. Es gibt keine Behauptung eines universell optimalen Zahlenpaars. Wiederholtes Anpassen nach Sichtung der Prüfung kann auch diese überanpassen; siehe [Novy-Marx, NBER Working Paper 21329](https://www.nber.org/papers/w21329). Kein Nachweis künftiger Profitabilität. Ergebnisse werden bei geändertem Asset, Zeitraum, Datenstand, Kosten, Kapital oder Suchraster verworfen. Die Suche lässt sich abbrechen.

Tests prüfen gemeinsame Trainingsdaten, Übereinstimmung mit dem Kostenmodell, unveränderte Auswahl bei manipulierten Prüfpreisen, Stichproben-/Rastergrenzen und Abbruch.

## SMA im Hauptdiagramm

Unter dem Hauptdiagramm-Werkzeugbereich lassen sich schnelle und langsame SMA einzeln einblenden. Sie beziehen sich auf das erste ausgewählte Asset mit täglichen Kursen; die beiden Längen sind mit den Feldern des Strategielabors synchronisiert. Monats- und Jahresmittel sind für diese Tageskurs-SMA ausgeschlossen. Farben, Strichmuster, Legende und Tooltip unterscheiden die beiden Linien.

Die Optimierung bietet zusätzlich **„Im Hauptdiagramm anzeigen“**. Das übernimmt den Gewinner in beide SMA-Felder, aktiviert beide Linien, setzt das optimierte Asset an die erste Stelle und öffnet die Marktanalyse im gewählten Zeitraum. Die Ansicht wird dabei auf nominale Werte umgestellt, passend zum Backtest; Inflationsbereinigung lässt sich anschließend wieder einschalten. Manuell eingestellte Längen können ebenfalls mit „SMA im Hauptdiagramm anzeigen“ übertragen werden. „Werte in Backtest übernehmen“ bleibt verfügbar und aktualisiert durch die gemeinsamen Felder auch bereits aktivierte SMA-Linien. Einstellungen gelten für die aktuelle geöffnete App-Sitzung.

Die Berechnung verwendet die vollständige nominale Tageshistorie einschließlich Aufwärmdaten vor dem sichtbaren Zeitraum. Erst danach werden Zeitraum, Inflationsskalierung und gemeinsame Indexbasis angewendet. Eine SMA wird **nicht separat auf 100 normiert**: sie teilt die Basis des zugehörigen Assets, auch bei gemeinsamem Vergleichsstart. Inflationsbereinigung multipliziert Kurs und SMA am selben Datum mit demselben Faktor und erhält dadurch deren Kreuzungen. Es werden keine fehlenden Aufwärmwerte erfunden; unzureichende Daten und ungültige Fenster werden angezeigt. CSV-Exporte enthalten aktivierte SMA-Reihen mit Asset, Art und Fensterlänge in der Reihenkennung.

Zusätzliche Tests prüfen Aufwärmdaten, gemeinsame Basis 100, Preisindex-Skalierung, fehlende Preisindexdaten und die Unabhängigkeit früherer SMA-Werte von späteren Kursen.

Monatliche Zusatzinvestitionen werden im Backtest und in der Optimierung berücksichtigt. Training und Prüfung verwenden jeweils ihren eigenen Zahlungsplan ab dem Folgemonat des effektiven Abschnittsbeginns. Rangfolge, Rendite und Rückgang sind um Einzahlungen bereinigt (TWR); Originalbeträge enthalten alle Einzahlungen. Details in [Strategie- und Ordervergleich](strategy-lab.md).
