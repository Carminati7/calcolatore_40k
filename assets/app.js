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

let contatoreProfili = 1;

function creaNuovoProfilo() {
    const container = document.getElementById('profili-container');
    const profiloId = contatoreProfili++;
    
    const profiloDiv = document.createElement('div');
    profiloDiv.className = 'profilo';
    profiloDiv.dataset.profiloId = profiloId;
    
    // Clona il contenuto del primo profilo e aggiorna gli ID
    const primoProfilo = container.querySelector('.profilo');
    const nuovoProfilo = primoProfilo.cloneNode(true);
    nuovoProfilo.dataset.profiloId = profiloId;
    
    // Aggiorna titolo
    const titolo = nuovoProfilo.querySelector('h3');
    titolo.textContent = `Profilo ${profiloId + 1}`;

    // Aggiungi il bottone per rimuovere
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-profile';
    removeButton.textContent = '✖ Rimuovi';
    removeButton.onclick = function() {
        if (document.querySelectorAll('.profilo').length > 1) {
            nuovoProfilo.remove();
        } else {
            alert('Non puoi rimuovere l\'ultimo profilo!');
        }
    };
    nuovoProfilo.appendChild(removeButton);
    
    // Aggiorna tutti gli ID e i for delle label
    nuovoProfilo.querySelectorAll('input, label').forEach(el => {
        if (el.id) {
            el.id = el.id.replace(/-\d+$/, `-${profiloId}`);
        }
        if (el.htmlFor) {
            el.htmlFor = el.htmlFor.replace(/-\d+$/, `-${profiloId}`);
        }
        if (el.name) {
            el.name = el.name.replace(/-\d+$/, `-${profiloId}`);
        }
        if (el.type === 'checkbox') {
            el.checked = false;
        } else if (el.type === 'number' || el.type === 'text') {
            el.value = el.type === 'number' ? (el.id.includes('sustainedHits') ? '0' : '') : '';
        }
    });
    
    container.appendChild(nuovoProfilo);
    
    // Setup checkbox listeners for the new profile
    function setupProfileCheckboxes(profiloId) {
        var reroll1 = document.getElementById(`reroll1-${profiloId}`);
        var rerollFail = document.getElementById(`rerollFail-${profiloId}`);
        var rerollWound1 = document.getElementById(`rerollWound1-${profiloId}`);
        var rerollWoundFail = document.getElementById(`rerollWoundFail-${profiloId}`);
        
        if (reroll1 && rerollFail) {
            reroll1.addEventListener('change', function() {
                if (reroll1.checked) rerollFail.checked = false;
            });
            
            rerollFail.addEventListener('change', function() {
                if (rerollFail.checked) reroll1.checked = false;
            });
        }
        
        if (rerollWound1 && rerollWoundFail) {
            rerollWound1.addEventListener('change', function() {
                if (rerollWound1.checked) rerollWoundFail.checked = false;
            });
            
            rerollWoundFail.addEventListener('change', function() {
                if (rerollWoundFail.checked) rerollWound1.checked = false;
            });
        }
    }
    
    // Setup checkbox listeners for the new profile
    setupProfileCheckboxes(profiloId);
}

function calcolaProfilo(profiloId, valoriComuni) {
    const prefix = (id) => `${id}-${profiloId}`;
    const getValue = (id) => document.getElementById(prefix(id)).value;
    const isChecked = (id) => document.getElementById(prefix(id)).checked;
    
    const attacchi = parseInt(getValue('attacchi'), 10);
    const balistic = parseInt(getValue('balistic'), 10);
    const sustainedHits = parseInt(getValue('sustainedHits'), 10);
    const reroll1 = isChecked('reroll1');
    const rerollFail = isChecked('rerollFail');
    const rerollWound1 = isChecked('rerollWound1');
    const rerollWoundFail = isChecked('rerollWoundFail');
    const forza = parseInt(getValue('forza'), 10);
    const penetrazione = parseInt(getValue('penetrazione'), 10);
    const danniInput = getValue('danni');
    const danni = calcolaDannoMedio(danniInput);
    const lethalHits = isChecked('lethalHits');
    
    const { resistenza, salvezza, ferite, modelliTotali } = valoriComuni;
    
    // Probabilità di colpire con un 6
    const probSix = 1/6;
    // Probabilità di colpire con risultati non-6
    const probNormalHit = calcolaProbColpire(balistic, reroll1, rerollFail, sustainedHits) - (lethalHits ? probSix : 0);
    
    // Calcola probabilità separate per colpi normali e Lethal Hits
    const probFerireNormal = calcolaProbFerire(forza, resistenza, rerollWound1, rerollWoundFail, lethalHits, false);
    const probFerireLethal = lethalHits ? calcolaProbFerire(forza, resistenza, rerollWound1, rerollWoundFail, lethalHits, true) : 0;
    
    const probNonSalvato = calcolaProbNonSalvato(salvezza, penetrazione);
    
    // Combina le probabilità
    const probColpoValido = (probNormalHit * probFerireNormal + (lethalHits ? probSix * probFerireLethal : 0)) * probNonSalvato;
    
    // Calcola i risultati
    const modelliEliminati = stimaModelliEliminati(attacchi, probColpoValido, danni, ferite);
    const danniTotali = attacchi * probColpoValido * danni;
    
    return { modelliEliminati, danniTotali };
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calcolatore-form');
    const risultatiSeparati = document.getElementById('risultati-separati');
    const risultatoAggregato = document.getElementById('risultato-aggregato');
    
    // Aggiungi listener per il pulsante "Aggiungi profilo"
    document.getElementById('aggiungi-profilo').addEventListener('click', creaNuovoProfilo);
    
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // Raccogli i valori comuni
        const valoriComuni = {
            resistenza: parseInt(form.resistenza.value, 10),
            salvezza: parseInt(form.salvezza.value, 10),
            ferite: parseInt(form.ferite.value, 10),
            modelliTotali: parseInt(form.modelli.value, 10)
        };

        // Calcola risultati per ogni profilo
        let modelliEliminatiTotali = 0;
        let danniTotali = 0;
        risultatiSeparati.innerHTML = '';
        
        // Trova tutti i profili
        const profili = document.querySelectorAll('.profilo');
        
        profili.forEach((profilo, index) => {
            const profiloId = profilo.dataset.profiloId;
            const risultato = calcolaProfilo(profiloId, valoriComuni);
            
            modelliEliminatiTotali += risultato.modelliEliminati;
            danniTotali += risultato.danniTotali;
            
            // Mostra risultati del singolo profilo
            const profiloResult = document.createElement('div');
            profiloResult.className = 'risultato-profilo';
            profiloResult.innerHTML = `
                <h4>Profilo ${index + 1}</h4>
                <div>Danni inflitti: <strong>${risultato.danniTotali.toFixed(2)}</strong></div>
                <div>Modelli eliminati: <strong>${risultato.modelliEliminati.toFixed(2)}</strong></div>
            `;
            risultatiSeparati.appendChild(profiloResult);
        });
        
        // Calcola e mostra risultati aggregati
        const percentualeTotale = (valoriComuni.modelliTotali > 0) ? 
            Math.min(100, (modelliEliminatiTotali / valoriComuni.modelliTotali) * 100) : 0;
        
        const probTuttiEliminati = stimaProbTuttiEliminati(
            danniTotali, // Usiamo i danni totali come "numero di attacchi" equivalente
            1, // La probabilità è già inclusa nei danni totali
            1, // Il danno è già incluso nei danni totali
            valoriComuni.modelliTotali,
            valoriComuni.ferite
        );
        
        risultatoAggregato.innerHTML = `
            <div>Danni totali inflitti: <strong>${danniTotali.toFixed(2)}</strong></div>
            <div>Totale modelli eliminati: <strong>${modelliEliminatiTotali.toFixed(2)}</strong></div>
            <div>Percentuale totale unità eliminata: <strong>${percentualeTotale.toFixed(1)}%</strong></div>
            <div>Probabilità di eliminare tutti i modelli: <strong>${(probTuttiEliminati * 100).toFixed(1)}%</strong></div>
        `;
    });
});
