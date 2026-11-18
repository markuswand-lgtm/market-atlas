# Vergleichsmatrix

Die neue Ansicht **Vergleichsmatrix** vergleicht alle 70 verfügbaren Reihen. Das Startpreset umfasst die 19 täglich erfassten Markt-Assets. Weitere Presets übernehmen die Auswahl des Hauptdiagramms, alle Reihen oder Langzeithistorien. Gruppen und einzelne Reihen können frei gewählt werden.

## Bedienung

- Kalenderdaten oder 1-/3-/5-/10-Jahres- und MAX-Presets wählen.
- Den markierten Bereich der Zeitachse ziehen, den Schieberegler bewegen oder mit den Pfeilen vor/zurück gehen. Die Fensterlänge bleibt dabei in Kalendermonaten erhalten. Wiedergabe wandert monatlich bzw. bei Jahresdaten jährlich weiter und hält am Ende an; bei verborgenem Browser-Tab pausiert sie.
- Zwischen **Gleichlauf** und **Stärkeunterschied** wechseln. Drei Farbpaletten, frei einstellbare Endfarben und Umkehrung der Palette sind verfügbar.
- Eine Zelle wählen: Direkt darunter öffnet sich der Quotient Zeilenasset / Spaltenasset über die gesamte gemeinsame verfügbare Historie. Matrixzeitraum und Basis 100 sind umschaltbar. Zwei frei wählbare Quantile (0–100 %, Standard 10/90) lassen sich als horizontale Linien zuschalten. Die farbige Verlaufsspur berechnet dieselbe Fensterlänge für bis zu ungefähr 90 frühere Fenster; ein Klick übernimmt das Fenster.
- CSV exportiert sämtliche gerichteten Paare mit Kennzahl, Häufigkeit, angefragtem und effektivem Zeitraum, Veränderungen, ausgelassenen Intervallen und Gründen für fehlende Ergebnisse.

Die Matrix ist in beide Richtungen scrollbar. Zeilen-/Spaltenüberschriften bleiben sichtbar. Zellen sind per Tastatur fokussierbar und mit Pfeiltasten erreichbar. Zahlen, Vorzeichen und zugängliche Beschriftungen ergänzen die Farben; fehlende Werte erscheinen als „—“.

## Datenabgleich

Keine neuen Datenanbieter: Die Ansicht liest dieselben automatisch aktualisierten Quellen und denselben veröffentlichten Snapshot wie das Hauptdiagramm, einschließlich des vorbereiteten geschützten Firebase-Datenpfads. Maximal sechs parallele Downloads; ein fehlgeschlagener Download macht nur diese Reihe leer und wird mit einem Wiederholungsbutton gemeldet. Nach einer Datenaktualisierung werden alle Reihen erneut geladen.

Automatisch wird bis drei Jahre täglich, bis 40 Jahre monatlich und darüber jährlich abgetastet; die langsamste Quellfrequenz bleibt die Untergrenze. Jede ausgewählte Jahresreihe erzwingt Jahresvergleich; eine Monatsreihe verhindert tägliche Vergleiche. Es wird nie hochgerechnet oder fortgeschrieben. Nur abgeschlossene Kalenderperioden bis zum gewählten Enddatum zählen.

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

## Fokus-Asset und Extremwerte

Unter dem Paarvergleich vergleicht **Ein Asset gegen alle** das gewählte Zeilenasset mit allen ausgewählten Partnern. Rangfolge und stärkster/schwächster Partner basieren auf dem Renditeabstand am Paarende. Das relative Verhältnis `100 × (A/A_Start) / (B/B_Start)` wird zusätzlich über die Zeit ausgewertet: Minimum und Maximum mit erstem Trefferdatum je Partner, sowie die Extrempartner insgesamt. CSV enthält Endabstand, Korrelation, exakte Paarzeiträume und Extremwerte.

**Gleicher Start und Schluss für alle Partner** verwendet die ersten/letzten tatsächlich bei allen Reihen vorhandenen Perioden. Ohne gemeinsame Überlappung bleiben Ergebnisse leer. Standardmäßig bleiben Paarzeiträume unabhängig; unterschiedliche Startdaten sind sichtbar und schränken Rangvergleiche ein. Das Diagramm zeigt standardmäßig die Extrempartner, optional alle.

## Quotient und Quantile

Das beim Matrixklick geöffnete Diagramm zeigt `A_t / B_t`. Es nutzt die langsamere **native** Frequenz der beiden Reihen (bei zwei Tagesquellen täglich), unabhängig von der Matrix-Abtastung. Datenlücken werden nicht gefüllt; Quotienten mit Nenner null oder nichtendlichen Ergebnissen entfallen. Basis 100 benötigt positive Quotienten und verwendet den ersten gemeinsamen Wert als Basis. Fremde Währungen werden nicht konvertiert.

Quantile verwenden alle gültigen Beobachtungen im angezeigten Verhältniszeitraum vor der grafischen Verdichtung, gleich gewichtet. Lineare Interpolation Typ 7: sortierte Werte, `h=(n−1)×p`, Interpolation zwischen `floor(h)` und `ceil(h)`, mit nullbasierten Indizes. 0 % = Minimum, 100 % = Maximum. [Definition in der R-Dokumentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/quantile.html). Quantile sind Verteilungskennwerte, keine Prognoseintervalle. Bei Änderungen an Paar, Zeitraum, Darstellung und Daten werden sie neu berechnet.

## Diagrammachsen

Alle Haupt-, Verhältnis- und Strategiediagramme verwenden glatte Y-Skalen, kalenderbezogene X-Markierungen und Hilfslinien beider Achsen. Basis-100-Diagramme heben die 100-%-Linie hervor. Rohwertdiagramme zeigen ihre ursprünglichen Einheiten. Logarithmische Achsen verwenden positive 1/2/5-Potenzen, bei engem Bereich passende Zwischenwerte.

## Rollierende Quantile

Unter dem Verhältnisdiagramm kann bei aktivierten Quantilen zwischen dem gesamten dargestellten Zeitraum und einem rollierenden Kalenderfenster gewechselt werden. Presets 1, 2, 5, 10 und 20 Jahre, frei 1–200 ganze Jahre. Jeder Quantilpunkt verwendet nur Beobachtungen aus `[Datum minus N Jahre, Datum]`. Der 29. Februar wird bei Bedarf auf den 28. Februar zurückgesetzt. Quantillinien beginnen erst, wenn ein vollständiger Kalender-Rückblick vorliegt; es werden mindestens zwei gültige Beobachtungen benötigt. Vor dem sichtbaren Matrixfenster vorhandene Kurse dürfen zum Rückblick beitragen. Keine zukünftigen Beobachtungen und keine Datenauffüllung. Quantile werden auf allen Beobachtungen berechnet, nicht auf der verdichteten Zeichenkurve. Bezeichnungen verwenden `S&P 500/Gold` als Verhältnisname.
