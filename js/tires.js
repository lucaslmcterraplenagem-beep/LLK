// Módulo de Gestão de Pneus – CRUD 100% na tabela public.pneus (Supabase)

function renderTireList() {
    const container = document.getElementById('tire-list-container');
    if (!container) return;

    if (!state.pneus || state.pneus.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200"><i class="fa-solid fa-circle-dot text-3xl mb-2 text-slate-400"></i><p>Nenhum pneu registado no stock.</p></div>`;
        return;
    }

    container.innerHTML = state.pneus.map(t => {
        const sulco = t.sulco_atual != null ? t.sulco_atual : (t.sulcoAtual != null ? t.sulcoAtual : t.sulco);
        const status = t.status || 'Estoque';
        return `
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex justify-between items-center hover:border-emerald-300 transition">
            <div>
                <span class="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">Fogo: ${escapeHtml(t.fogo || t.numero)}</span>
                <h4 class="text-base font-bold text-slate-800 mt-1">${escapeHtml(t.marca)} - ${escapeHtml(t.medida || '')}</h4>
                <p class="text-xs text-slate-500">Sulco Atual: ${sulco != null ? sulco : '-'} mm | Estado: ${escapeHtml(status)}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="editTire('${t.id}')" class="p-1.5 text-slate-500 hover:text-slate-800 transition" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteTire('${t.id}')" class="p-1.5 text-red-500 hover:text-red-700 transition" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

async function saveTire(event) {
    event.preventDefault();
    if (!currentAuthUser) { alert('Faça login primeiro.'); return; }

    const editId = (document.getElementById('tire-edit-id')?.value || '').trim();
    const fogo = document.getElementById('tire-fogo')?.value.trim();
    const marca = document.getElementById('tire-marca')?.value.trim();
    const medida = document.getElementById('tire-medida')?.value.trim() || null;
    const sulcoAtual = Number(document.getElementById('tire-sulco')?.value) || 0;
    const status = document.getElementById('tire-status')?.value || 'Estoque';

    if (!fogo || !marca) {
        alert('Preencha os campos obrigatórios do pneu (fogo e marca).');
        return;
    }

    try {
        setCloudSyncStatus('saving', 'Salvando pneu no Supabase...');
        if (editId) {
            const { data, error } = await sb.from('pneus').update({
                fogo, marca, medida, sulco_atual: sulcoAtual, status, updated_at: new Date().toISOString()
            }).eq('id', editId).eq('owner_id', currentAuthUser.id).select().single();
            if (error) throw error;
            const idx = state.pneus.findIndex(p => p.id === editId);
            if (idx >= 0) {
                state.pneus[idx] = { ...state.pneus[idx], ...data, sulcoAtual: data.sulco_atual, sulco: data.sulco_atual };
            }
            await logAudit('Pneus', 'Atualizar', `Pneu ${fogo} atualizado`);
        } else {
            const { data, error } = await sb.from('pneus').insert({
                owner_id: currentAuthUser.id,
                fogo, marca, medida, sulco_atual: sulcoAtual, status: 'Estoque'
            }).select().single();
            if (error) throw error;
            state.pneus.unshift({ ...data, sulcoAtual: data.sulco_atual, sulco: data.sulco_atual, numero: data.fogo });
            await logAudit('Pneus', 'Criar', `Pneu ${fogo} cadastrado`);
        }
        setCloudSyncStatus('ok', 'Pneu sincronizado no Supabase');
        renderTireList();
        if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
        document.getElementById('tire-form')?.reset();
        const editEl = document.getElementById('tire-edit-id');
        if (editEl) editEl.value = '';
        alert(editId ? 'Pneu atualizado!' : 'Pneu registado com sucesso!');
    } catch (err) {
        console.error(err);
        setCloudSyncStatus('error', 'Erro ao salvar pneu: ' + (err.message || err));
        alert('Erro ao salvar pneu: ' + (err.message || err));
    }
}

function editTire(id) {
    const t = state.pneus.find(p => String(p.id) === String(id));
    if (!t) { alert('Pneu não encontrado.'); return; }

    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
    set('tire-edit-id', t.id);
    set('tire-fogo', t.fogo || t.numero);
    set('tire-marca', t.marca);
    set('tire-medida', t.medida);
    set('tire-sulco', t.sulco_atual != null ? t.sulco_atual : (t.sulcoAtual ?? t.sulco ?? 0));
    set('tire-status', t.status || 'Estoque');

    if (document.getElementById('modal-tire')) openModal('modal-tire');
    else document.getElementById('tire-fogo')?.focus();
}

async function deleteTire(id) {
    if (!confirm('Deseja realmente eliminar este pneu?')) return;
    if (!currentAuthUser) return;

    try {
        setCloudSyncStatus('saving', 'Excluindo pneu no Supabase...');
        const { error } = await sb.from('pneus').delete().eq('id', id).eq('owner_id', currentAuthUser.id);
        if (error) throw error;
        const removed = state.pneus.find(p => p.id === id);
        state.pneus = state.pneus.filter(t => t.id !== id);
        await logAudit('Pneus', 'Excluir', `Pneu ${removed?.fogo || id} excluído`);
        setCloudSyncStatus('ok', 'Pneu excluído no Supabase');
        renderTireList();
        if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
        if (typeof renderVehicleMap === 'function') renderVehicleMap();
    } catch (err) {
        console.error(err);
        setCloudSyncStatus('error', 'Erro ao excluir: ' + (err.message || err));
        alert('Erro ao excluir pneu: ' + (err.message || err));
    }
}
