// Módulo de Veículos e Mapa de Pneus
function renderVehicleList() {
    const container = document.getElementById('vehicle-list-container');
    if (!container) return;
    
    if (state.veiculos.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200"><i class="fa-solid fa-truck-front text-3xl mb-2 text-slate-400"></i><p>Nenhum veículo cadastrado ainda.</p></div>`;
        return;
    }

    container.innerHTML = state.veiculos.map(v => `
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-emerald-300 transition">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <span class="text-xs font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">${escapeHtml(v.tipo)}</span>
                    <h3 class="text-lg font-bold text-slate-800 mt-1">${escapeHtml(v.placa)}</h3>
                </div>
                <div class="flex gap-2">
                    <button onclick="openVehicleMap('${v.id}')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">
                        <i class="fa-solid fa-map mr-1"></i> Mapa de Pneus
                    </button>
                    <button onclick="editVehicle('${v.id}')" class="p-1.5 text-slate-500 hover:text-slate-800 transition"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteVehicle('${v.id}')" class="p-1.5 text-red-500 hover:text-red-700 transition"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <p class="text-xs text-slate-500">Frota / Empresa: ${escapeHtml(v.frota || 'Geral')}</p>
        </div>
    `).join('');
}

function saveVehicle(event) {
    event.preventDefault();
    const placa = document.getElementById('vehicle-placa').value.trim().toUpperCase();
    const tipo = document.getElementById('vehicle-tipo').value;
    const frota = document.getElementById('vehicle-frota').value.trim();

    if (!placa) {
        alert('Informe a placa do veículo.');
        return;
    }

    const novoVeiculo = {
        id: 'v_' + Date.now(),
        placa,
        tipo,
        frota,
        eixos: VEHICLE_PRESETS[tipo] || VEHICLE_PRESETS['truck-6x2']
    };

    state.veiculos.push(novoVeiculo);
    saveState();
    renderVehicleList();
    
    document.getElementById('vehicle-form').reset();
    alert('Veículo cadastrado com sucesso!');
}

function deleteVehicle(id) {
    if (!confirm('Deseja realmente excluir este veículo?')) return;
    state.veiculos = state.veiculos.filter(v => v.id !== id);
    saveState();
    renderVehicleList();
}

function openVehicleMap(id) {
    const v = state.veiculos.find(item => item.id === id);
    if (!v) return;
    alert('Abrindo o mapa interativo para o veículo: ' + v.placa);
}
