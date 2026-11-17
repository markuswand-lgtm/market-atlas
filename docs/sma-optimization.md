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
