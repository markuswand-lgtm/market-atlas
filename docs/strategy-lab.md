# Strategie- und Ordervergleich

Das Strategielabor enthält zusätzlich zur bestehenden SMA-Optimierung einen Vergleich von bis zu zwölf Varianten und einer unabhängigen Buy-&-Hold-Referenz. Alle verwenden dasselbe Asset, denselben effektiven Zeitraum, Startkapital, Gebühren und Slippage. Nur tägliche Quellen sind zugelassen; der gemeinsame Start wird für das längste benötigte Aufwärmfenster verschoben und angezeigt. Einstellungen, Assetwechsel, Zeitraumwechsel und neue Daten aktualisieren einen gestarteten Vergleich automatisch.

## Strategien

- Buy & Hold, SMA- und EMA-Trendfolge (schneller Durchschnitt über langsamem).
- Wilder-RSI: unter Kaufgrenze Long, über Verkaufsgrenze Cash; dazwischen Zustand halten. Konstante Kurse ergeben RSI 50.
- Bollinger-Rückkehr: Schluss unter SMA minus Faktor × Populationsstandardabweichung eröffnet Long; Rückkehr zum SMA schließt.
- Kanalausbruch: Schluss über Hoch der **vorherigen** N Schlusskurse eröffnet; unter vorherigem Tief schließt.
- Momentum: Long bei positivem Abstand zum Schluss vor N Beobachtungen.
- Zwölf monatliche Investitionsstufen: Zielquote steigt pro Kalendermonat um ein Zwölftel. Kein zusätzliches Kapital; Umgewichtungen werden aus Cash finanziert.
- Experimenteller SMA-Gegentrend: invertierte SMA-Regel.
- Experimentelle Drawdown-Stufen: pro Rückgangsstufe vom vorherigen Fensterhoch eine Kapitalstufe, begrenzt auf die gewählte Anzahl; bei Erholung wieder reduzieren.
- Experimentelle Saisonregel: November bis April Long, sonst Cash.

Fenster zählen vorhandene Beobachtungen; Wochenenden zählen bei Krypto mit. Die Varianten teilen Zahlenparameter, können aber Strategie, Einstiegsorder und Automatiken unabhängig wählen. Kopieren ermöglicht direkte Order- und Automatikvergleiche derselben Strategie.

## Ausführung

Nach Schluss t entsteht das Signal; früheste Ausführung ist Schluss t+1. Kapital startet zum ersten Testschluss, deshalb wird die erste Tagesbewegung davor nicht verdient. Alle offenen Positionen werden zum letzten Schluss einschließlich Kosten liquidiert. Bruchstücke, Long und Cash; kein Kredit oder Short. Gebühren werden auf tatsächlich gehandelten Nominalbetrag berechnet; Käufe sind durch verfügbares Cash einschließlich Gebühren begrenzt. Slippage wirkt bei Kauf positiv und bei Verkauf negativ auf den Preis.

| Einstiegsorder | Schlusskursmodell |
|---|---|
| Market | nächster Schluss nach Signal |
| Limit | ab nächstem Schluss nur inklusive Slippage höchstens Signalpreis minus Abstand |
| Stop | Schluss mindestens Signalpreis plus Abstand aktiviert Market für darauffolgenden Schluss |
| Stop-Limit | gleiche Aktivierung; danach frühestens nächster Schluss, aber maximal Stop-Schwelle inklusive Slippage |

Ungefüllte Einstiegsorders verfallen nach der gewählten Beobachtungszahl; ein bereits ausgelöster Stop wird als Market ausgeführt. Stop-Limits können ungefüllt verfallen. Neue Signale können Orders stornieren und neu einstellen. Reduktionen/Ausstiege verwenden Market. Orderprotokoll und CSV enthalten Signal, Ausführung, Preis, Menge, Gebühr und Auslöser. Dies ist eine bewusste Schlusskurs-Näherung, kein vollständiges Broker-Fill-Modell. [Ordertypen: Investor.gov](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14).

## Optionale Automatiken

Stop-Loss vom gewichteten Einstiegspreis, Take-Profit, Trailing vom höchsten beobachteten Schluss seit Einstieg, Ausstieg nach Haltedauer, Pause nach vollständigem Ausstieg, dauerhafte Kapital-Notbremse vom bisherigen Kapitalhoch, tägliche/wöchentliche/monatliche Signalprüfung und Wiederherstellung der Zielquote. Schutzregeln prüfen jeden Schluss unabhängig von der Signalfrequenz.

Priorität: Kapital-Notbremse, Stop-Loss, Trailing, Take-Profit, Zeit. Genau eine Exitorder zum nächsten Schluss; offene Einstiege werden aufgehoben. Schwellen null deaktivieren die jeweilige Regel. Ausschalten von Automatiken je Variante deaktiviert diese Regeln, Rebalancing und Signalfrequenzbegrenzung. Strategie, Einstiegsorder und Kapitalquote bleiben erhalten. Die Referenz investiert 100 % ohne Automatiken.

## Vergleich und Grenzen

Kapitalverläufe als Originalbetrag oder Basis 100, Endkapital, Gesamt-/Jahresrendite, maximaler Rückgang, Orders, Gebühren, durchschnittlicher Kapitalanteil im Markt und stornierte Orders. Die CSV-Exporte enthalten Parameter und Variante sowie alle Kurven oder Orders.

Intraday-Berührungen, reale Liquidität und Ausführungsreihenfolge fehlen bei Schlusskursdaten. Cash ist unverzinst; keine Steuern oder gesonderten Dividenden-/Rollkosten. Indizes sind nicht direkt handelbar. Historische Datenrevisionen bleiben ex post. Viele ausprobierte Varianten können historische Ergebnisse überanpassen; der Vergleich enthält keine automatische Gewinnerempfehlung. Für SMA bleibt die separate Trainings-/Prüfzeitraumsuche erhalten. [Indikatorgrundlagen: Fidelity](https://www.fidelity.com/learning-center/trading-investing/technical-analysis).

Tests prüfen Gebühren und Slippage, verzögerte Ausführung, Limits, Stop-Limit-Nichtausführung, Schutzregeln, unveränderte Vergangenheit bei Änderung zukünftiger Preise und gemeinsame Vergleichszeiträume.

## Monatliche Zusatzinvestition

Neben dem einmaligen Startkapital kann eine monatliche Investitionssumme (0 = aus) eingestellt werden. Der Betrag gilt gemeinsam im Variantenvergleich, im separaten SMA-Test und bei der SMA-Optimierung. Währung ist die Modellwährung des Assets. Erste Einzahlung im Kalendermonat nach dem effektiven Testbeginn, danach am ersten vorhandenen Kurs jedes neuen Monats. Bei fehlenden ganzen Monaten wird die Summe beim nächsten Kurs gesammelt eingebucht. Alle Vergleichsvarianten einschließlich Referenz erhalten identische Cashflows.

Im Variantenvergleich ist frisches Cash ab diesem Schluss verfügbar; Investition folgt den gewählten Strategie-, Signal- und Orderregeln, frühestens am nächsten Schluss, sofern keine bereits vorher platzierte Order an diesem Schluss ausgeführt wird. Im bestehenden SMA-Test gilt die feste Sparplananweisung: während einer Long-Phase Kauf zum Einzahlungsschluss, in Cash-Phasen zurückhalten. Signalwechsel bleiben nachgelagert wie zuvor. Gebühren gelten auch für Sparplankäufe; auf eine reine Einzahlung fällt keine Gebühr an.

**Originalbetrag** zeigt tatsächliches Modellkapital inklusive Einzahlungen. Im Variantenvergleich ergänzt eine gestrichelte Linie das insgesamt eingezahlte Kapital. Tabellen zeigen Einzahlungssumme und absoluten Gewinn/Verlust (`Endkapital − Gesamteinzahlungen`). CSV enthält Einzahlungen und Renditeverläufe.

**Basis 100**, Gesamt-/Jahresrendite, Rückgang und Kapital-Notbremse verwenden zeitgewichtete Renditen (TWR). Dazu wird vor jeder Einzahlung der Portfoliowert zum aktuellen Schluss durch die bisherige Anzahl rechnerischer Anteile geteilt. Die Einzahlung erzeugt neue Anteile zu diesem Wert; Gebühren senken anschließend den Anteilwert. Eine Einzahlung selbst ändert diesen Wert nicht. Dies misst die Strategieentwicklung, nicht die persönliche geldgewichtete Verzinsung aller Einzahlungen.

Bei der SMA-Suche beginnen Training und Prüfung unabhängig jeweils mit Startkapital und eigenem monatlichen Zahlungsplan. Die Rangfolge verwendet einzahlungsbereinigte Renditen. Bei null Monatsbetrag bleibt der bestehende SMA-Test unverändert.
