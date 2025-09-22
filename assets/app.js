// Calcola il danno medio da input testuale (es. 2, 1-3, 1,2,3, D3)
function calcolaDannoMedio(input) {
    input = input.trim().toUpperCase().replace(/\s+/g, '');
    // Supporta espressioni tipo D6+2, 2+D3, D3+1, D3+D6, ecc.
    // Split su +
    if (input.includes('+')) {
        const parts = input.split('+');
        let sum = 0;
        for (let part of parts) {
            sum += calcolaDannoMedio(part);
        }
        return sum;
    }
    // Notazione Dn (es. D3)
    if (/^D(\d+)$/.test(input)) {
        const n = parseInt(input.slice(1), 10);
        return (1 + n) / 2;
    }
    // Numero singolo
    if (/^\d+$/.test(input)) {
        return parseInt(input, 10);
    }
    // Intervallo (es. 1-3)
    if (/^(\d+)-(\d+)$/.test(input)) {
        const [min, max] = input.split('-').map(Number);
        if (min > max) return min; // fallback
        return (min + max) / 2;
    }
    // Lista separata da virgole (es. 1,2,3)
    if (/^\d+(,\d+)+$/.test(input)) {
        const values = input.split(',').map(Number);
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
    return 1; // fallback
}


// Utility: calcola il fattoriale di un numero intero non negativo
function fattoriale(n) {
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

// Calcola la probabilità di colpire in base alla balistic skill e gestisce Sustained Hits
// reroll1: reroll dei risultati 1
// rerollFail: reroll di tutti i falliti
// sustainedHits: numero di colpi extra per ogni 6 ottenuto
function calcolaProbColpire(balistic, reroll1 = false, rerollFail = false, sustainedHits = 0) {
    const base = (7 - balistic) / 6;
    let probBase;
    
    if (rerollFail) {
        // Probabilità di colpire con reroll di tutti i falliti: base + (1-base)*base
        probBase = base + (1 - base) * base;
    } else if (reroll1) {
        // Probabilità di colpire con reroll dei 1: base + (1/6) * base
        probBase = base + (1/6) * base;
    } else {
        probBase = base;
    }
    
    // Se sustainedHits è attivo, calcola la probabilità extra considerando i 6
    if (sustainedHits > 0) {
        // Probabilità di ottenere un 6 (1/6)
        const probSix = 1/6;
        // Ogni 6 genera sustainedHits colpi extra
        const extraHits = probSix * sustainedHits;
        return probBase + extraHits;
    }
    
    return probBase;
}

// Calcola la probabilità di ferire in base a forza e resistenza
function calcolaProbFerire(forza, resistenza, rerollWound1 = false, rerollWoundFail = false, lethalHits = false, isLethalHit = false) {
    // Se è un Lethal Hit (da un 6 per colpire) e Lethal Hits è attivo, ferita automatica
    if (lethalHits && isLethalHit) {
        return 1;
    }

    let soglia;
    if (forza >= 2 * resistenza) {
        soglia = 2;
    } else if (forza > resistenza) {
        soglia = 3;
    } else if (forza === resistenza) {
        soglia = 4;
    } else if (forza * 2 <= resistenza) {
        soglia = 6;
    } else {
        soglia = 5;
    }
    
    const base = (7 - soglia) / 6;
    
    if (rerollWoundFail) {
        // Probabilità di ferire con reroll di tutti i falliti: base + (1-base)*base
        return base + (1 - base) * base;
    }
    if (rerollWound1) {
        // Probabilità di ferire con reroll dei 1: base + (1/6) * base
        return base + (1/6) * base;
    }
    return base;
}

// Calcola la probabilità che la salvezza avversaria non annulli il colpo
function calcolaProbNonSalvato(salvezza, penetrazione) {
    let salvezzaEffettiva = salvezza + penetrazione;
    if (salvezzaEffettiva > 6) salvezzaEffettiva = 7; // 7+ = nessuna salvezza
    const probSalvezza = salvezzaEffettiva >= 7 ? 0 : (7 - salvezzaEffettiva) / 6;
    return 1 - probSalvezza;
}

// Calcola il numero atteso di modelli eliminati (considerando la somma di più attacchi a segno)
function stimaModelliEliminati(attacchi, probColpoValido, danni, ferite) {
    if (ferite <= 0) return 0;
    const attacchiASegnoAttesi = attacchi * probColpoValido;
    const danniTotaliAttesi = attacchiASegnoAttesi * danni;
    return danniTotaliAttesi / ferite;
}

// Calcola la probabilità di eliminare tutti i modelli (approssimazione Poisson sui danni attesi)
function stimaProbTuttiEliminati(attacchi, probColpoValido, danni, modelliTotali, ferite) {
    if (modelliTotali <= 0 || ferite <= 0) return 0;
    const attacchiASegnoAttesi = attacchi * probColpoValido;
    const danniTotaliAttesi = attacchiASegnoAttesi * danni;
    const N = modelliTotali * ferite;
    let somma = 0;
    for (let k = 0; k < N; k++) {
        somma += Math.pow(danniTotaliAttesi, k) / fattoriale(k);
    }
    let prob = 1 - Math.exp(-danniTotaliAttesi) * somma;
    return Math.max(0, Math.min(1, prob));
}

// Calcola i danni attesi totali
function stimaDanniAttesi(attacchi, probColpire, probFerire, probNonSalvato, danni) {
    return attacchi * probColpire * probFerire * probNonSalvato * danni;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calcolatore-form');
    const risultato = document.getElementById('risultato');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        // Raccolta dati e validazione
        const attacchi = parseInt(form.attacchi.value, 10);
        const balistic = parseInt(form.balistic.value, 10);
        const sustainedHits = parseInt(form.sustainedHits.value, 10);
        const reroll1 = form.reroll1 && form.reroll1.checked;
        const rerollFail = form.rerollFail && form.rerollFail.checked;
        const rerollWound1 = form.rerollWound1 && form.rerollWound1.checked;
        const rerollWoundFail = form.rerollWoundFail && form.rerollWoundFail.checked;
        const forza = parseInt(form.forza.value, 10);
        const resistenza = parseInt(form.resistenza.value, 10);
        const penetrazione = parseInt(form.penetrazione.value, 10);
        const danniInput = form.danni.value;
        const danni = calcolaDannoMedio(danniInput);
        const salvezza = parseInt(form.salvezza.value, 10);
        const ferite = parseInt(form.ferite.value, 10);
        const modelliTotali = parseInt(form.modelli.value, 10);

        // Calcoli di probabilità
        const lethalHits = form.lethalHits && form.lethalHits.checked;
        
        // Probabilità di colpire con un 6
        const probSix = 1/6;
        // Probabilità di colpire con risultati non-6
        const probNormalHit = calcolaProbColpire(balistic, reroll1, rerollFail, sustainedHits) - (lethalHits ? probSix : 0);
        
        // Calcola probabilità separate per colpi normali e Lethal Hits
        const probFerireNormal = calcolaProbFerire(forza, resistenza, rerollWound1, rerollWoundFail, lethalHits, false);
        const probFerireLethal = lethalHits ? calcolaProbFerire(forza, resistenza, rerollWound1, rerollWoundFail, lethalHits, true) : 0;
        
        const probNonSalvato = calcolaProbNonSalvato(salvezza, penetrazione);
        
        // Combina le probabilità: (prob colpo normale * prob ferire normale + prob colpo 6 * prob ferire lethal) * prob non salvato
        const probColpoValido = (probNormalHit * probFerireNormal + (lethalHits ? probSix * probFerireLethal : 0)) * probNonSalvato;

        // Stime
        const modelliEliminati = stimaModelliEliminati(attacchi, probColpoValido, danni, ferite);
        const percentuale = (modelliTotali > 0) ? Math.min(100, (modelliEliminati / modelliTotali) * 100) : 0;
        const probTuttiEliminati = stimaProbTuttiEliminati(attacchi, probColpoValido, danni, modelliTotali, ferite);
        const attacchiStimati = attacchi * probColpoValido * danni;

        // Output
        risultato.innerHTML = `Valore stimato danni inflitti: <strong>${attacchiStimati.toFixed(2)}</strong><br>Modelli eliminati: <strong>${modelliEliminati.toFixed(2)}</strong><br>Percentuale unità eliminata: <strong>${percentuale.toFixed(1)}%</strong><br>Probabilità di eliminare tutti i modelli: <strong>${(probTuttiEliminati * 100).toFixed(1)}%</strong>`;
    });
});
