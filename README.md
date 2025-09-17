# Calcolatore 40k

Questa è una web app statica pronta per il deploy su GitHub Pages.


## Struttura del progetto
- `index.html`: Homepage dell'app, include:
		- Header con titolo
		- Layout a 3 colonne responsive:
			- **Colonna 1 (La tua unità):**
				- Numero di attacchi
				- Balistic skill (es: 3 per 3+)
				- Forza
				- Penetrazione armatura (AP)
				- Danni
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
			- Probabilità di ferire: in base a Forza e Resistenza avversario (regole Warhammer)
			- Probabilità di salvezza: (7 - (Salvezza avversaria + Penetrazione)) / 6 (minimo 0)
			- Valore atteso: attacchi × prob. colpire × prob. ferire × (1 - prob. salvezza) × danni
			- Modelli eliminati: danni attesi / ferite del bersaglio
			- Percentuale unità eliminata: modelli eliminati / numero di modelli inserito
			- Probabilità di eliminare tutti i modelli bersaglio: calcolata tramite distribuzione di Poisson sui danni attesi
- `README.md`: Questo file

## Responsive Design
L'app è progettata per essere **responsive**: utilizzabile su dispositivi mobili e desktop, con layout adattivo e mobile-friendly.

## Deploy su GitHub Pages
1. Fai il push di tutti i file su un repository GitHub.
2. Vai su "Settings" > "Pages" nel repository.
3. Scegli il branch (di solito `main` o `master`) e la root (`/`) come cartella.
4. Salva e attendi la pubblicazione.

L'app sarà disponibile all'indirizzo `https://<tuo-username>.github.io/<nome-repo>/`.
