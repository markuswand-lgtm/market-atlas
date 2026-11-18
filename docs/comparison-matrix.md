# Vergleichsmatrix

Die neue Ansicht **Vergleichsmatrix** vergleicht alle 60 verfügbaren Reihen. Das Startpreset umfasst die 18 täglich erfassten Markt-Assets. Weitere Presets übernehmen die Auswahl des Hauptdiagramms, alle Reihen oder Langzeithistorien. Gruppen und einzelne Reihen können frei gewählt werden.

## Bedienung

- Kalenderdaten oder 1-/3-/5-/10-Jahres- und MAX-Presets wählen.
- Den markierten Bereich der Zeitachse ziehen, den Schieberegler bewegen oder mit den Pfeilen vor/zurück gehen. Die Fensterlänge bleibt dabei in Kalendermonaten erhalten. Wiedergabe wandert monatlich bzw. bei Jahresdaten jährlich weiter und hält am Ende an; bei verborgenem Browser-Tab pausiert sie.
- Zwischen **Gleichlauf** und **Stärkeunterschied** wechseln. Drei Farbpaletten, frei einstellbare Endfarben und Umkehrung der Palette sind verfügbar.
- Eine Zelle wählen: Das Paardiagramm normiert beide Reihen am selben gemeinsamen Start auf 100, zeigt Veränderungen und die tatsächliche Datenabdeckung. Die farbige Verlaufsspur berechnet dieselbe Fensterlänge für bis zu ungefähr 90 frühere Fenster; ein Klick übernimmt das Fenster.
- CSV exportiert sämtliche gerichteten Paare mit Kennzahl, Häufigkeit, angefragtem und effektivem Zeitraum, Veränderungen, ausgelassenen Intervallen und Gründen für fehlende Ergebnisse.

Die Matrix ist in beide Richtungen scrollbar. Zeilen-/Spaltenüberschriften bleiben sichtbar. Zellen sind per Tastatur fokussierbar und mit Pfeiltasten erreichbar. Zahlen, Vorzeichen und zugängliche Beschriftungen ergänzen die Farben; fehlende Werte erscheinen als „—“.

## Datenabgleich

Keine neuen Datenanbieter: Die Ansicht liest dieselben automatisch aktualisierten Quellen und denselben veröffentlichten Snapshot wie das Hauptdiagramm, einschließlich des vorbereiteten geschützten Firebase-Datenpfads. Maximal sechs parallele Downloads; ein fehlgeschlagener Download macht nur diese Reihe leer und wird mit einem Wiederholungsbutton gemeldet. Nach einer Datenaktualisierung werden alle Reihen erneut geladen.

Die Standardfrequenz ist monatlich. Jede ausgewählte Jahresreihe erzwingt Jahresvergleich; eine Monatsreihe verhindert tägliche Vergleiche. Es wird nie hochgerechnet oder fortgeschrieben. Nur abgeschlossene Kalenderperioden bis zum gewählten Enddatum zählen.

- Tagesquellen: letzter vorhandener Wert im Monat/Jahr, höchstens sieben Kalendertage vor Periodenende.
- Monatsquellen: Quellenwert dieses Monats; bei Jahresauswahl Dezember. Ein Monatsmittel wird nicht zu einem Schlusskurs umgedeutet.
- Jahresquellen: unveränderter Jahresquellenwert, mit Kalenderjahresende als Vergleichsschlüssel. Historische Januar-Zeichnungsschlüssel geben damit keinen vorzeitigen Jahreswert vor.
- Je Paar werden nur übereinstimmende Perioden benutzt. Verschiedene Paare können verschiedene effektive Start-/Enddaten haben. Quellenmittel, Schlusskurse, Revisionen und Veröffentlichungsverzögerungen bleiben methodische Unterschiede. Dies ist eine nachträgliche Analyse, kein Backtest mit historischen Informationsständen.

## Kennzahlen

**Gleichlauf:** Pearson-Korrelation der einfachen prozentualen Veränderungen. [Formel und Definition bei NIST](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/correlat.htm). Keine Korrelation trendender Kursniveaus. Für Monats-/Jahresdaten müssen die gemeinsamen Perioden aufeinanderfolgen. Bei Tagespaaren müssen die beiden Endpunkte für beide Reihen identisch sein; Abstand höchstens sieben Kalendertage. Damit nutzt z. B. ein Aktien-/Kryptopaar jeweils Freitag–Montag, nicht Freitag–Montag gegen Sonntag–Montag. Intervalle mit nichtpositiven oder nichtendlichen Werten entfallen; ihre Zahl wird angezeigt.

Mindestumfang: 20 tägliche, 6 monatliche oder 5 jährliche gemeinsame Veränderungen. Konstante Veränderungen haben keine definierte Korrelation. „—“ bezeichnet fehlende Überschneidung, zu wenige gültige Veränderungen oder fehlende Varianz, niemals einen fiktiven Nullwert. Die Farbskala ist stets −1 bis +1. Historische Korrelation belegt weder Kausalität noch künftigen Gleichlauf; nahe null schließt nichtlineare Beziehungen nicht aus.

**Stärkeunterschied:** `100 × [(Zeile_Ende / Zeile_Start − 1) − (Spalte_Ende / Spalte_Start − 1)]`, in Prozentpunkten. Mindestens zwei gemeinsame Perioden und ausschließlich positive gemeinsame Stichprobenwerte erforderlich. Beide Reihen haben dieselben Endpunkte; zwischenzeitliche Lücken werden nicht aufgefüllt. Die transponierte Zelle hat das umgekehrte Vorzeichen. Die wählbare symmetrische Farbgrenze bleibt beim Verschieben fest; außerhalb liegende Werte werden farblich gesättigt, numerisch vollständig angezeigt.

Veränderungen sind nominal, ohne Wechselkursumrechnung und Inflationsbereinigung. Staatsschulden, Geldmengen und Verbraucherpreisindizes sind keine Anlageerträge. Eine Schuldenquote wird hier relativ in Prozent verändert; dies ist nicht die Differenz ihrer ursprünglichen BIP-Prozentpunkte. DAX enthält Dividenden, andere Kursindizes nicht. Die eigenen Quellenhinweise in der Datenbank gelten unverändert.

## Prüfung

`tests/comparison-matrix.test.mjs` prüft variable/inverse/konstante Veränderungen, gemeinsame Endpunkte, Aktien-/Kryptokalender, Lücken, Jahreszeichnungsschlüssel, unvollständige Perioden, negative Werte, Matrixsymmetrie/Vorzeichen, Zeitfenstergrenzen und feste Farbskalen. Zusätzlich Browserprüfung von 18/60/ausgewählten Reihen, Zeitregler, Metrikwechsel, Farben, Paarauswahl und schmalem Layout.
