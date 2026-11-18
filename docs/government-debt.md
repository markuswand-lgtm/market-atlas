# Staatsverschuldung

Die App enthält USA, Deutschland, China, Japan, Großbritannien, Frankreich, Italien, Indien, Kanada, Brasilien, Spanien, Schweiz und das offizielle IMF-Weltaggregat. Quelle ist der [IMF World Economic Outlook](https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO/WEOWORLD). Der jährliche Schuldenstand umfasst den Gesamtstaat und ist eine Bruttogröße. Er umfasst keine gesamte private Verschuldung und ist keine handelbare Kursreihe.

Je Gebiet gibt es zwei ausdrücklich getrennte Reihen:

- **Quote in % des BIP**: IMF `GGXWDG_NGDP`, unverändert aus der Quelle. Die Weltquote stammt direkt aus `WEOWORLD`, nicht aus der Summe der zwölf ausgewählten Länder.
- **Abgeleiteter Betrag in Mrd. USD**: `GGXWDG_NGDP × NGDPD / 100`, gleiche Gebietskennung, gleiches Jahr, gleicher Downloadlauf. `NGDPD` ist das nominale BIP in Milliarden US-Dollar. Es handelt sich um eine Näherung aus gerundeten Quoten und Jahresdurchschnittskursen, nicht um einen amtlichen Schuldenbetrag zum Stichtagskurs. Der Weltbetrag wird aus Weltquote und Welt-BIP abgeleitet.

[WEO-Aggregationsmethodik](https://data.imf.org/en/Datasets/WEO/Groups-and-Aggregates-April-2025): fiskalische Aggregate basieren auf in US-Dollar umgerechneten nationalen Daten. Der veröffentlichte WEO-Abdeckungsumfang gilt auch für die Weltreihe; „Welt“ bedeutet nicht eine lückenlose Vollerhebung jedes Staatsgebiets.

Aktueller Erstimport: WEO Oktober 2026, abgeschlossene Jahre bis 2025. Abgeschlossene Jahre sind nicht automatisch endgültige Ist-Werte; sie können Schätzungen enthalten. Die API liefert keine einheitliche belastbare Ist-/Schätzkennzeichnung pro Beobachtung, daher zeigt die App diesen Hinweis durchgehend. Das laufende Kalenderjahr und spätere Prognosejahre werden ausgeschlossen. Der tägliche Job prüft auf Revisionen und neue Daten, obwohl die Quellendaten jährlich sind. Der 31. Dezember ordnet den Jahreswert auf der Zeitachse zu; nationale Fiskaljahre können abweichen.

Zusätzlich enthält die App zwei eigene [IMF HPDD-Archivserien](https://www.imf.org/external/datamapper/datasets/DEBT): USA 1800–2015 und Deutschland 1880–2015. Datenlücken werden weder aufgefüllt noch durch lange Chartlinien verdeckt. Diese historischen Schuldenquoten werden wegen wechselnder Abgrenzungen und Gebiete nicht mit der aktuellen WEO-Reihe verkettet.

Schuldenquoten werden auch bei aktiviertem Inflationsknopf nicht mit einem Preisindex deflationiert. Nominale USD-Beträge können mit dem gewählten Preisindex bereinigt werden. Eine solche Bereinigung ist keine Wechselkurs- oder lokale Kaufkraftumrechnung. Basis 100 bleibt für Wachstumsvergleiche verfügbar, „Originaleinheiten“ zeigt die tatsächliche Quote bzw. den abgeleiteten Betrag.

Quellenschnittstelle: [IMF DataMapper API](https://www.imf.org/external/datamapper/api/help). Fehlende Werte bleiben fehlend; der USD-Betrag wird nur bei gültiger Quote und positivem BIP desselben Jahres berechnet.

## Automatischer Abruf und Ausweichquelle

Die offizielle DataMapper-API v2 wird zuerst abgefragt. Falls der IMF Zugriffe aus dem GitHub-Rechenzentrum ablehnt, nutzt die App für Länderreihen die offizielle [Weiterveröffentlichung des IMF WEO durch World Bank Data360](https://data360.worldbank.org/en/api). Die Datenbank verlinkt dann die tatsächlich verwendete World-Bank-Quelle. Die WEO-Reihen können sich in Rundungspräzision und Veröffentlichungsstand unterscheiden; es werden keine verschieden abgegrenzten Schuldenkonzepte vermischt.

Data360 liefert das nominale BIP in USD-Basiseinheiten, obwohl `UNIT_MULT=9` die Quellenskalierung dokumentiert. Für Mrd. USD wird ausdrücklich durch eine Milliarde geteilt. Der Import prüft Gebiet, Indikator, Jahresfrequenz, Einheit, neuesten Quellenstand und Vollständigkeit der Antwort. Für die Weltreihe bietet dieser Spiegel kein entsprechendes Aggregat. Bleibt deren IMF-Abruf gesperrt, wird der letzte erfolgreiche Stand behalten und in der App als nicht aktualisiert gekennzeichnet. Die bis 2015 abgeschlossenen HPDD-Reihen bleiben Archivserien.
