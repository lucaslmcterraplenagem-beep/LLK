// Módulo de Gestão de Pneus e Stock
function renderTireList() {
    const container = document.getElementById('tire-list-container');
    if (!container) return;
    
    if (state.pneus.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200"><i class="fa-solid fa-circle-dot text-3xl mb-2 text-slate-400"></i><p>Nenhum pneu registado no stock.</p></div>`;
        return;
    }

    container.innerHTML = state.pneus.map(t => `
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex justify-between items-center hover:border-emerald-300 transition">
            <div>
                <span class="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">Fogo: ${escapeHtml(t.fogo || t.numero)}</span>
                <h4 class="text-base font-bold text-slate-800 mt-1">${escapeHtml(t.marca)} - ${escapeHtml(t.medida)}</h4>
                <p class="text-xs text-slate-500">Sulco Atual: ${t.sulcoAtual || '-'} mm | Estado: ${escapeHtml(t.status || 'Stock')}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="editTire('${t.id}')" class="p-1.5 text-slate-500 hover:text-slate-800 transition"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteTire('${t.id}')" class="p-1.5 text-red-500 hover:text-red-700 transition"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function saveTire(event) {
    event.preventDefault();
    const fogo = document.getElementById('tire-fogo').value.trim();
    const marca = document.getElementById('tire-marca').value.trim();
    const medida = document.getElementById('tire-medida').value.trim();
    const sulcoAtual = document.getElementById('tire-sulco').value;

    if (!fogo || !marca) {
        alert('Preencha os campos obrigatórios do pneu.');
        return;
    }

    const novoPneu = {
        id: 't_' + Date.now(),
        fogo,
        marca,
        medida,
        sulcoAtual: Number(sulcoAtual) || 0,
        status: 'Stock',
        historico: []
    };

    state.pneus.push(novoPneu);
    saveState();
    renderTireList();
    
    document.getElementById('tire-form').reset();
    alert('Pneu registado com sucesso!');
}

function deleteTire(id) {
    if (!confirm('Deseja realmente eliminar este pneu?')) return;
    state.pneus = state.pneus.filter(t => t.id !== id);
    saveState();
    renderTireList();
}
