# Methodik und Datenqualität

## Historien

Der Katalog in `lib/catalog.ts` definiert Instrument, Quelle, Frequenz, Einheit und Einschränkungen. Marktpreise sind Schlusskurse, Geldmengen und Verbraucherpreise Monatsbeobachtungen. Der Download fordert die gesamte abrufbare Anbieterhistorie an. Dies ist nicht gleichbedeutend mit der längsten weltweit lizenzierbaren Historie. Fehlende Beobachtungen werden ausgelassen; Null- und Negativpreise bleiben erhalten. Doppelte Schlüssel `(series_id, date)` werden aktualisiert. Rohdaten, Zeitpunkt, Quelle und Importstatus bleiben nachvollziehbar.

Yahoo-Tagesreihen werden mit explizitem `period1` und `period2` angefordert. `range=max` kann vom Anbieter auf Quartalsdaten umgestellt werden und wird deshalb nicht verwendet. Der Parser verweigert eine nicht tägliche Antwort. Die nicht offiziell garantierte Schnittstelle kann sich ändern. Stooq lieferte beim Aufbau eine Browser-Challenge und wird nicht automatisiert umgangen.

DAX ist ein Performanceindex, US-Indizes sind Kursindizes. Gold und Silber verwenden Yahoo-Futuresreihen; sie sind keine Spotreihen und enthalten kein explizites Rollrenditemodell. WTI und Brent verwenden EIA-Spotpreise über FRED. Die Rohreihen sind keine unmittelbar handelbaren Portfolios.

## Geldmenge

- USD: Federal Reserve, M2SL, saisonbereinigt, Mrd. USD, via FRED.
- EUR: EZB, BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E, M3 saison-/kalenderbereinigt; Millionen EUR / 1000 = Mrd. EUR.
- GBP/JPY: OECD M3 über FRED, nationale Währung / 1e9 = Milliarden; archivierte Reihen enden November 2023.

M2 und M3 sind unterschiedlich definiert. Die Reihen dürfen weder als gleiche Aggregate noch ohne Wechselkursumrechnung als globale Summe verstanden werden. Die App stellt Originaleinheiten für eine Einzelreihe und einen Indexvergleich für mehrere Reihen bereit.

## Inflationsbereinigung

`real(t) = nominal(t) × CPI(Basismonat) / CPI(Monat(t))`

Basismonat ist der letzte verfügbare CPI-Monat bis zum gewählten Endmonat. Nur exakte Monatszuordnungen werden genutzt. Keine Extrapolation, kein Interpolieren fehlender CPI-Werte. Der Indexvergleich erfolgt nach der Deflation. USA: BLS CPIAUCSL, saisonbereinigt. Euroraum: Eurostat über EZB, HICP.M.U2.N.000000.4D0.INX, 2025=100, nicht saisonbereinigt. Der alte ICP-Datenfluss endete 2025 und wird nicht mit dem neuen Basisjahr unskaliert verkettet.

Der gewählte Preisindex beschreibt einen Konsumraum. Es findet keine Währungsumrechnung statt. Die Darstellung ist ex post; die Veröffentlichung eines Monatsindex erfolgt später als der Beobachtungsmonat. Deflation ist deshalb keine point-in-time handelbare Signaldatenquelle. Der Strategietest verwendet ausschließlich nominale Kurse.

## Kennzahlen, Trend und Vergleich

Gesamtrendite = letzter / erster Wert − 1. CAGR verwendet tatsächliche Kalendertage / 365,2425. Drawdown = Minimum aus Wert / laufendem Höchstwert − 1. Prozentkennzahlen sind bei Null- oder Negativpreisen deaktiviert. Trend: kleinste Quadrate gegen vergangene Kalenderjahre im gewählten Trendfenster, optional auf logarithmierten Werten. R² wird gegen numerische Rundungsfehler auf [0,1] begrenzt. Trend endet am letzten Fit-Datum und ist keine Vorhersage.

Mehrere Reihen beginnen im Indexvergleich an ihrer jeweiligen ersten Beobachtung am oder nach dem spätesten Anfangsdatum. Der gemeinsame Beginn wird angezeigt; Monats- und Handelskalender bleiben unterschiedlich. Zeichnung wird über Min/Max-Buckets verdichtet, Berechnungen und CSV verwenden alle Beobachtungen.

## Strategietest

Long/Cash-SMA. Signal mit Schlusskurs t−1, Ausführung am Schluss t und Rendite ab t nach t+1. Aufwärmhistorie liegt vor dem gewählten Beginn. Handelskosten in Basispunkten pro Positionswechsel inklusive Einstieg und Schlussliquidation. Buy & Hold trägt Ein- und Ausstiegskosten. Cash ist unverzinst. Keine Steuern, Slippage, Rollkosten oder zusätzliche Dividendenmodellierung. Keine Parameteroptimierung oder Out-of-sample-Validierung. Revidierbare Quellendaten statt Vintage-Historie.

## Bildtranskription

Original: `public/reference/market-cycle-original.png`, vom Nutzer bereitgestellt. Strukturierte Jahresangaben: `lib/cycles.ts`. A = Panik, B = hohe Preise, C = niedrige Preise nach der Behauptung im Bild. Zeile B enthält sichtbar 1891 und 1899 innerhalb späterer Jahre. Diese Angaben werden unverändert gespeichert und als Unsicherheit erklärt. Die in der Grafik zusätzlich enthaltenen Abstands-/Innenzahlen sind keine Datumswerte. Die Zeitachse im Tool ist maßstäblich; die ursprüngliche Grafik ist es nicht. Keine wissenschaftlich validierte Prognose, keine automatische Handelsempfehlung.
