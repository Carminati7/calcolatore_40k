// Calcola il danno medio da input testuale (es. 2, 1-3, 1,2,3, D3)
function calcolaDannoMedio(input) {
    input = input.trim().toUpperCase();
    if (/^D(\d+)$/.test(input)) {
        // Notazione Dn (es. D3)
        const n = parseInt(input.slice(1), 10);
        return (1 + n) / 2;
    }
    if (/^\d+$/.test(input)) {
        // Numero singolo
        return parseInt(input, 10);
    }
    if (/^(\d+)-(\d+)$/.test(input)) {
        // Intervallo (es. 1-3)
        const [min, max] = input.split('-').map(Number);
        if (min > max) return min; // fallback
        return (min + max) / 2;
    }
    if (/^\d+(,\d+)+$/.test(input)) {
        // Lista separata da virgole (es. 1,2,3)
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

// Calcola la probabilità di colpire in base alla balistic skill
function calcolaProbColpire(balistic) {
    return (7 - balistic) / 6;
}

// Calcola la probabilità di ferire in base a forza e resistenza
function calcolaProbFerire(forza, resistenza) {
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
    return (7 - soglia) / 6;
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
        const forza = parseInt(form.forza.value, 10);
        const resistenza = parseInt(form.resistenza.value, 10);
        const penetrazione = parseInt(form.penetrazione.value, 10);
        const danniInput = form.danni.value;
        const danni = calcolaDannoMedio(danniInput);
        const salvezza = parseInt(form.salvezza.value, 10);
        const ferite = parseInt(form.ferite.value, 10);
        const modelliTotali = parseInt(form.modelli.value, 10);

        // Calcoli di probabilità
        const probColpire = calcolaProbColpire(balistic);
        const probFerire = calcolaProbFerire(forza, resistenza);
        const probNonSalvato = calcolaProbNonSalvato(salvezza, penetrazione);
        const probColpoValido = probColpire * probFerire * probNonSalvato;

        // Stime
        const modelliEliminati = stimaModelliEliminati(attacchi, probColpoValido, danni, ferite);
        const percentuale = (modelliTotali > 0) ? Math.min(100, (modelliEliminati / modelliTotali) * 100) : 0;
        const probTuttiEliminati = stimaProbTuttiEliminati(attacchi, probColpoValido, danni, modelliTotali, ferite);
        const attacchiStimati = stimaDanniAttesi(attacchi, probColpire, probFerire, probNonSalvato, danni);

        // Output
        risultato.innerHTML = `Valore stimato danni inflitti: <strong>${attacchiStimati.toFixed(2)}</strong><br>Modelli eliminati: <strong>${modelliEliminati.toFixed(2)}</strong><br>Percentuale unità eliminata: <strong>${percentuale.toFixed(1)}%</strong><br>Probabilità di eliminare tutti i modelli: <strong>${(probTuttiEliminati * 100).toFixed(1)}%</strong>`;
    });
});
