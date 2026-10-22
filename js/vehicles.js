// Módulo de Veículos e Mapa de Pneus (Integrado com Supabase)

async function loadVeiculosFromSupabase() {
    if (!window.supabaseClient) return;
    
    const { data, error } = await window.supabaseClient
        .from('lk_pneus_veiculos')
        .select('*');
    
    if (error) {
        console.error('Erro ao carregar veículos do Supabase:', error);
        return;
    }

    // Transforma o record_data do Supabase para o state da aplicação
    state.veiculos = (data || []).map(row => ({
        id: row.id,
        user_id: row.user_id,
        ...(row.record_data || {})
    }));

    renderVehicleList();
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
}

function renderVehicleList() {
    const container = document.getElementById('vehicle-list-container');
    if (!container) return;
    
    if (!state.veiculos || state.veiculos.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200"><i class="fa-solid fa-truck-front text-3xl mb-2 text-slate-400"></i><p>Nenhum veículo cadastrado ainda.</p></div>`;
        return;
    }

    container.innerHTML = state.veiculos.map(v => `
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-emerald-300 transition">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <span class="text-xs font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">${escapeHtml(v.tipo || 'Veículo')}</span>
                    <h3 class="text-lg font-bold text-slate-800 mt-1">${escapeHtml(v.placa || '')}</h3>
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

async function saveVehicle(event) {
    event.preventDefault();
    const placa = document.getElementById('vehicle-placa').value.trim().toUpperCase();
    const tipo = document.getElementById('vehicle-tipo').value;
    const frota = document.getElementById('vehicle-frota').value.trim();

    if (!placa) {
        alert('Informe a placa do veículo.');
        return;
    }

    const vehicleId = 'v_' + Date.now();
    const vehicleData = {
        id: vehicleId,
        placa,
        tipo,
        frota,
        eixos: VEHICLE_PRESETS[tipo] || VEHICLE_PRESETS['truck-6x2']
    };

    // Salva no Supabase se o cliente estiver ativo
    if (window.supabaseClient) {
        const user = window.currentUser || (await window.supabaseClient.auth.getUser()).data.user;
        
        const { error } = await window.supabaseClient
            .from('lk_pneus_veiculos')
            .insert([{
                id: vehicleId,
                user_id: user ? user.id : null,
                record_data: vehicleData
            }]);

        if (error) {
            console.error('Erro ao salvar veículo no Supabase:', error);
            alert('Erro ao salvar no banco de dados.');
            return;
        }
    }

    state.veiculos.push(vehicleData);
    renderVehicleList();
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    
    document.getElementById('vehicle-form').reset();
    if (typeof closeModal === 'function') closeModal('modal-veiculo');
    alert('Veículo cadastrado com sucesso!');
}

async function deleteVehicle(id) {
    if (!confirm('Deseja realmente excluir este veículo?')) return;

    if (window.supabaseClient) {
        const { error } = await window.supabaseClient
            .from('lk_pneus_veiculos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir no Supabase:', error);
            alert('Erro ao excluir do banco de dados.');
            return;
        }
    }

    state.veiculos = state.veiculos.filter(v => v.id !== id);
    renderVehicleList();
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
}

function openVehicleMap(id) {
    const v = state.veiculos.find(item => item.id === id);
    if (!v) return;
    alert('Abrindo o mapa interativo para o veículo: ' + v.placa);
}
