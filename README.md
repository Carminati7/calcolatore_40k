# Calcolatore 40k

Questa è una web app statica pronta per il deploy su GitHub Pages.


## Struttura del progetto
- `index.html`: Homepage dell'app, include:
		- Header con titolo
		- Layout a 3 colonne responsive:
			- **Colonna 1 (La tua unità):**
				- Numero di attacchi
				   - Balistic skill (es: 3 per 3+)
				   - [ ] Permetti reroll di tutti i tiri falliti (checkbox, esclusiva)
				   - [ ] Permetti reroll dei risultati 1 (checkbox, esclusiva)
				- Forza
				- Penetrazione armatura (AP)
					- Danni (accetta valore singolo, intervallo es. 1-3, lista es. 1,2,3, notazione Dn es. D3, o formule come D6+2, 2+D3, D3+1)
				- Pulsante Calcola
			- **Colonna 2 (Bersaglio):**
				- Resistenza avversario
				- Salvezza avversaria (es: 3 per 3+)
				- Ferite del bersaglio
				- Numero di modelli nell'unità
			- **Colonna 3 (Risultato):**
				- Area per visualizzare il risultato
- `assets/`: Cartella per immagini, stili CSS e JS
	- `style.css`: Stili responsive mobile-first, adattivi anche su desktop
		- `app.js`: Script JS che calcola il valore stimato dei danni inflitti in base ai dati inseriti:
				- Probabilità di colpire: (7 - Balistic skill) / 6
				- Se attivi una delle due opzioni di reroll, la probabilità di colpire viene ricalcolata considerando il reroll selezionato. Le due opzioni sono mutualmente esclusive.
			   - Probabilità di ferire: in base a Forza e Resistenza avversario (regole Warhammer)
			   - Probabilità di salvezza: (7 - (Salvezza avversaria + Penetrazione)) / 6 (minimo 0)
				- Danni: puoi inserire un valore singolo (es. 2), un intervallo (es. 1-3), una lista (es. 1,2,3), la notazione Dn (es. D3), oppure una formula (es. D6+2, 2+D3, D3+1). Il calcolatore userà il valore medio risultante della formula inserita.
			   - Valore atteso: attacchi × prob. colpire × prob. ferire × (1 - prob. salvezza) × danno medio
			   - Modelli eliminati: danni attesi / ferite del bersaglio
			   - Percentuale unità eliminata: modelli eliminati / numero di modelli inserito
			   - Probabilità di eliminare tutti i modelli bersaglio: calcolata tramite distribuzione di Poisson sui danni attesi
- `README.md`: Questo file

## Responsive Design
L'app è progettata per essere **responsive**: utilizzabile su dispositivi mobili e desktop, con layout adattivo e mobile-friendly.

## Release

- Versione corrente: **v1.0.0**
- Leggi il changelog dettagliato: `CHANGELOG.md` (file nella root del repository)

## Deploy su GitHub Pages
1. Fai il push di tutti i file su un repository GitHub.
2. Vai su "Settings" > "Pages" nel repository.
3. Scegli il branch (di solito `main` o `master`) e la root (`/`) come cartella.
4. Salva e attendi la pubblicazione.

L'app sarà disponibile all'indirizzo `https://<tuo-username>.github.io/<nome-repo>/`.

## PWA e risoluzione problemi

Se installi l'app come PWA e l'icona aprisse una path sbagliata (ad es. l'app parte da `/` invece che da `/calcolatore_40k/`), disinstalla l'app, apri la pagina pubblicata, vai in DevTools → Application, unregister il service worker e usa Clear site data, poi reinstalla la PWA. Verifica che il manifest esponga <code>start_url</code> e <code>scope</code> corretti.

## Autocommit watcher (opzionale)

Se vuoi che le modifiche locali vengano automaticamente aggiunte e committate (ma senza essere pushate), puoi usare lo script PowerShell incluso:

- `scripts/autocommit.ps1`: osserva il repository, raggruppa le modifiche rapide e crea commit automatici con messaggi tipo `autosave: ... @ timestamp`.
- Per avviarlo: apri PowerShell nella root del progetto e esegui:

```powershell
.\scripts\autocommit.ps1
```

- Nota: lo script non esegue la `git push`; rimane necessario eseguire `git push` manualmente quando vuoi pubblicare i commit.
- Se usi VS Code, è disponibile un task (Tasks → Run Task → Autocommit Watcher) che avvia lo script.
