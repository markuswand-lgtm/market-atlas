# Weiterentwicklung

Bereits umgesetzt: Anbieteradapter, tägliche/monatliche Historien, SQLite/D1, Importprotokoll, Multi-Asset-Diagramme, CSV-Export, Regression, Geldmengen, CPI/HVPI-Deflation, SMA-Backtest und Bildtranskription.

1. Lizenzierte Datenadapter für ältere Dow-Jones-, Edelmetall-Spot- und Futureshistorien; Preis/Total-Return, Adjustierung und Rollmethoden separat modellieren.
2. GBP/JPY-Geldmengen direkt mit aktuellen BoE/BoJ-Daten fortschreiben; Serienbrüche und Definitionen prüfen. Weitere Verbraucherpreisräume ergänzen.
3. Historische Veröffentlichungsstände (Vintages) und Revisionsprotokolle statt Überschreiben alter Werte; Importe atomar in Staging-Tabellen austauschen.
4. Portfolio-Gewichtungen, FX-Konvertierung, Rebalancing, Korrelation und Out-of-sample-Strategietests.
5. Geplante Datenaktualisierung als explizit eingerichteter Job. Derzeit erfolgt Aktualisierung per Schaltfläche oder CLI; kein heimlich eingerichteter Zeitplan.
6. Vor Mehrbenutzerbetrieb: Rollen, serverseitige Eigentümerprüfung, Rate Limits und getrennte Portfolios. Hosted Version bleibt owner-private.
