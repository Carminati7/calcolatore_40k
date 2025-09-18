# Changelog

Tutte le modifiche rilevanti al progetto sono elencate qui. Seguiamo Semantic Versioning per le release.

## [v1.0.0] - 2025-09-19
#### Aggiunto
- Pagina `changelog.html` (Diario di bordo) con riepilogo delle attività e note tecniche.
- Suddivisione dei fogli di stile in file per-pagina:
  - `assets/style-common.css` (stili condivisi)
  - `assets/style-index.css` (stili per `index.html`)
  - `assets/style-docs.css` (stili per `docs.html`)
  - `assets/style-changelog.css` (stili per `changelog.html`)
- Tag di release `v1.0.0` creato e pubblicato su origin.

#### Modificato
- Consolidamento PWA e asset:
  - `manifest.webmanifest` aggiornato per usare `start_url` = `/calcolatore_40k/index.html` e `scope` = `/calcolatore_40k/` (compatibilità GitHub Pages).
  - Correzione dei percorsi delle icone nel manifest (ora riferimenti assoluti `/calcolatore_40k/assets/...`).
  - Registrazione del service worker con percorso assoluto `/calcolatore_40k/service-worker.js`.
- Miglioramenti responsive e refactor CSS: ottimizzazioni per small/medium/large breakpoints e wrapping per `pre`/`code`.

#### Fix
- Risolti problemi di risoluzione degli asset quando il sito è servito da una sottocartella (es. GitHub Pages).

#### Documentazione
- Creato `CHANGELOG.md` (questa pagina).
- Aggiornato `README.md` (sezione Release) per collegarsi al changelog e indicare la versione `v1.0.0`.

> Note: per la lista completa dei commit vedi il log dei commit nel repository (git log).
