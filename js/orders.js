// Módulo de Ordens de Serviço – CRUD 100% na tabela public.ordens_servico (Supabase)

function renderOrderList() {
    const container = document.getElementById('table-ordens');
    if (!container) return;

    if (!state.ordens || state.ordens.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400">Nenhuma Ordem de Serviço emitida.</td></tr>`;
        return;
    }

    container.innerHTML = state.ordens.map(o => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-emerald-700">${escapeHtml(o.numero)}</td>
            <td class="p-3 whitespace-nowrap">${escapeHtml(formatDate(o.data))}</td>
            <td class="p-3 font-semibold">${escapeHtml(o.veiculo || o.veiculo_placa || '-')}</td>
            <td class="p-3">${escapeHtml(o.fornecedor || 'Oficina Interna')}</td>
            <td class="p-3"><span class="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">${escapeHtml(o.tipo)}</span></td>
            <td class="p-3 font-bold text-slate-800">${money(o.valor)}</td>
            <td class="p-3 text-right">
                <button onclick="viewOrderDetails('${o.id}')" title="Detalhes" class="text-emerald-600 hover:text-emerald-800 mr-2"><i class="fa-solid fa-eye"></i></button>
                <button onclick="deleteOrder('${o.id}')" title="Excluir" class="text-slate-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function saveOrder(event) {
    event.preventDefault();
    if (!currentAuthUser) { alert('Faça login primeiro.'); return; }

    const numero = document.getElementById('os-numero')?.value || ('OS-' + state.osCounter);
    const veiculoId = document.getElementById('os-veiculo')?.value;
    const tipo = document.getElementById('os-tipo')?.value || 'Manutenção';
    const valor = Number(document.getElementById('os-valor')?.value) || 0;
    const km = Number(document.getElementById('os-km')?.value) || 0;
    const status = document.getElementById('os-status')?.value || 'Aberta';
    const obs = document.getElementById('os-obs')?.value || null;
    const data = document.getElementById('os-data')?.value || new Date().toISOString();
    const fornecedorId = document.getElementById('os-fornecedor')?.value || null;

    const veiculo = (state.veiculos || []).find(v => String(v.id) === String(veiculoId));
    if (!veiculo) {
        alert('Selecione um veículo válido.');
        return;
    }

    const fornecedor = fornecedorId
        ? (state.fornecedores || []).find(f => String(f.id) === String(fornecedorId))
        : null;

    try {
        setCloudSyncStatus('saving', 'Salvando ordem no Supabase...');
        const payload = {
            owner_id: currentAuthUser.id,
            numero,
            data,
            veiculo_id: veiculo.id,
            veiculo_placa: veiculo.placa,
            fornecedor_id: fornecedor?.id || null,
            fornecedor: fornecedor?.nome || 'Oficina Interna',
            tipo,
            valor,
            km,
            status,
            obs
        };

        const { data: row, error } = await sb.from('ordens_servico').insert(payload).select().single();
        if (error) throw error;

        state.ordens.unshift({
            ...row,
            veiculo: row.veiculo_placa,
            veiculoId: row.veiculo_id
        });
        state.osCounter++;

        // Atualiza KM do veículo na tabela veiculos
        if (km > 0) {
            await sb.from('veiculos').update({ km, updated_at: new Date().toISOString() })
                .eq('id', veiculo.id).eq('owner_id', currentAuthUser.id);
            const vIdx = state.veiculos.findIndex(v => v.id === veiculo.id);
            if (vIdx >= 0) state.veiculos[vIdx].km = km;
        }

        await logAudit('Ordens', 'Criar', `OS ${numero} – ${veiculo.placa} – ${money(valor)}`);
        setCloudSyncStatus('ok', 'Ordem de serviço sincronizada no Supabase');
        renderOrderList();
        if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
        document.getElementById('os-form')?.reset();
        document.getElementById('form-ordem')?.reset();
        alert('Ordem de Serviço emitida com sucesso!');
    } catch (err) {
        console.error(err);
        setCloudSyncStatus('error', 'Erro ao salvar OS: ' + (err.message || err));
        alert('Erro ao salvar ordem: ' + (err.message || err));
    }
}

function viewOrderDetails(id) {
    const o = (state.ordens || []).find(item => item.id === id);
    if (!o) return;
    alert(`Detalhes da OS: ${o.numero}\nVeículo: ${o.veiculo || o.veiculo_placa}\nTipo: ${o.tipo}\nValor: ${money(o.valor)}\nStatus: ${o.status || '-'}\nObs: ${o.obs || '-'}`);
}

async function deleteOrder(id) {
    if (!confirm('Excluir esta ordem de serviço?')) return;
    if (!currentAuthUser) return;
    try {
        const { error } = await sb.from('ordens_servico').delete().eq('id', id).eq('owner_id', currentAuthUser.id);
        if (error) throw error;
        const removed = state.ordens.find(o => o.id === id);
        state.ordens = state.ordens.filter(o => o.id !== id);
        await logAudit('Ordens', 'Excluir', `OS ${removed?.numero || id} excluída`);
        renderOrderList();
        if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    } catch (err) {
        alert('Erro ao excluir: ' + (err.message || err));
    }
}

// Alias usado pelo HTML (form id="form-ordem" onsubmit="handleSaveOrdem(event)")
async function handleSaveOrdem(event) {
    return saveOrder(event);
}
