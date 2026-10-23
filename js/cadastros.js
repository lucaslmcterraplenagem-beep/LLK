// Cadastros – motoristas e fornecedores 100% Supabase + lista de veículos

function switchCadastroSubTab(subTabId) {
    document.querySelectorAll('.subtab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('subtab-' + subTabId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.subnav-btn').forEach(btn => {
        btn.classList.remove('border-emerald-500', 'text-emerald-600', 'font-semibold');
        btn.classList.add('border-transparent', 'text-slate-500');
    });

    const activeBtn = document.getElementById('subnav-' + subTabId);
    if (activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-slate-500');
        activeBtn.classList.add('border-emerald-500', 'text-emerald-600', 'font-semibold');
    }
}

function renderVeiculos() {
    const container = document.getElementById('table-veiculos');
    if (!container) return;

    if (!state.veiculos || state.veiculos.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-slate-400">Nenhum veículo cadastrado.</td></tr>';
        return;
    }

    container.innerHTML = state.veiculos.map(v => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-semibold text-slate-700">${escapeHtml(v.prefixo || '-')}</td>
            <td class="p-3 font-bold text-slate-800">${escapeHtml(v.placa)}</td>
            <td class="p-3 font-medium">${escapeHtml(v.modelo)}<div class="text-[10px] text-slate-400">${escapeHtml(v.ano || '')}</div></td>
            <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md">${escapeHtml(v.categoria)}</span></td>
            <td class="p-3 font-mono text-xs text-slate-500">${escapeHtml(v.chassi || '-')}</td>
            <td class="p-3 font-medium">${(Number(v.km) || 0).toLocaleString('pt-BR')} KM</td>
            <td class="p-3 text-right">
                <button onclick="editVeiculo('${v.id}')" title="Editar veículo" class="text-blue-600 hover:text-blue-800 mr-3"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteVeiculo('${v.id}')" title="Excluir" class="text-slate-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderMotoristas() {
    const container = document.getElementById('table-motoristas');
    if (!container) return;

    if (!state.motoristas || state.motoristas.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">Nenhum motorista/colaborador cadastrado.</td></tr>';
        return;
    }

    container.innerHTML = state.motoristas.map(m => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-slate-800">${escapeHtml(m.nome)}<div class="text-[10px] text-slate-400">${escapeHtml(m.funcao || 'Motorista')}</div></td>
            <td class="p-3">${escapeHtml(m.cpf || '-')}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 font-medium text-xs rounded">${escapeHtml(m.cnh || 'Não se aplica')}</span></td>
            <td class="p-3">${escapeHtml(m.fone || '-')}</td>
            <td class="p-3 text-right">
                <button onclick="deleteMotorista('${m.id}')" class="text-slate-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function saveMotorista(event) {
    event.preventDefault();
    if (!currentAuthUser) { alert('Faça login primeiro.'); return; }

    const nome = document.getElementById('motorista-nome')?.value.trim();
    const cpf = document.getElementById('motorista-cpf')?.value.trim() || null;
    const cnh = document.getElementById('motorista-cnh')?.value.trim() || null;
    const fone = document.getElementById('motorista-fone')?.value.trim() || null;
    const funcao = document.getElementById('motorista-funcao')?.value.trim() || 'Motorista';

    if (!nome) { alert('Informe o nome do motorista.'); return; }

    try {
        setCloudSyncStatus('saving', 'Salvando motorista no Supabase...');
        const { data, error } = await sb.from('motoristas').insert({
            owner_id: currentAuthUser.id, nome, cpf, cnh, fone, funcao
        }).select().single();
        if (error) throw error;
        state.motoristas.unshift(data);
        await logAudit('Motoristas', 'Criar', `Motorista ${nome} cadastrado`);
        setCloudSyncStatus('ok', 'Motorista sincronizado no Supabase');
        renderMotoristas();
        document.getElementById('form-motorista')?.reset();
        closeModal('modal-motorista');
        alert('Motorista cadastrado!');
    } catch (err) {
        setCloudSyncStatus('error', err.message || String(err));
        alert('Erro: ' + (err.message || err));
    }
}

async function deleteMotorista(id) {
    if (!confirm('Excluir este motorista?')) return;
    if (!currentAuthUser) return;
    try {
        const { error } = await sb.from('motoristas').delete().eq('id', id).eq('owner_id', currentAuthUser.id);
        if (error) throw error;
        const m = state.motoristas.find(x => x.id === id);
        state.motoristas = state.motoristas.filter(x => x.id !== id);
        await logAudit('Motoristas', 'Excluir', `Motorista ${m?.nome || id} excluído`);
        renderMotoristas();
    } catch (err) {
        alert('Erro: ' + (err.message || err));
    }
}

function renderFornecedores() {
    const container = document.getElementById('table-fornecedores');
    if (!container) return;

    if (!state.fornecedores || state.fornecedores.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">Nenhum fornecedor cadastrado.</td></tr>';
        return;
    }

    container.innerHTML = state.fornecedores.map(f => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-slate-800">${escapeHtml(f.nome)}</td>
            <td class="p-3 font-mono text-xs">${escapeHtml(f.cnpj || '-')}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-medium text-xs rounded">${escapeHtml(f.tipo)}</span></td>
            <td class="p-3">${escapeHtml(f.fone || '-')}</td>
            <td class="p-3 text-right">
                <button onclick="deleteFornecedor('${f.id}')" class="text-slate-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function saveFornecedor(event) {
    event.preventDefault();
    if (!currentAuthUser) { alert('Faça login primeiro.'); return; }

    const nome = document.getElementById('fornecedor-nome')?.value.trim();
    const cnpj = document.getElementById('fornecedor-cnpj')?.value.trim() || null;
    const tipo = document.getElementById('fornecedor-tipo')?.value || 'Oficina';
    const fone = document.getElementById('fornecedor-fone')?.value.trim() || null;

    if (!nome) { alert('Informe o nome do fornecedor.'); return; }

    try {
        setCloudSyncStatus('saving', 'Salvando fornecedor no Supabase...');
        const { data, error } = await sb.from('fornecedores').insert({
            owner_id: currentAuthUser.id, nome, cnpj, tipo, fone
        }).select().single();
        if (error) throw error;
        state.fornecedores.unshift(data);
        await logAudit('Fornecedores', 'Criar', `Fornecedor ${nome} cadastrado`);
        setCloudSyncStatus('ok', 'Fornecedor sincronizado no Supabase');
        renderFornecedores();
        document.getElementById('form-fornecedor')?.reset();
        closeModal('modal-fornecedor');
        alert('Fornecedor cadastrado!');
    } catch (err) {
        setCloudSyncStatus('error', err.message || String(err));
        alert('Erro: ' + (err.message || err));
    }
}

async function deleteFornecedor(id) {
    if (!confirm('Excluir este fornecedor?')) return;
    if (!currentAuthUser) return;
    try {
        const { error } = await sb.from('fornecedores').delete().eq('id', id).eq('owner_id', currentAuthUser.id);
        if (error) throw error;
        const f = state.fornecedores.find(x => x.id === id);
        state.fornecedores = state.fornecedores.filter(x => x.id !== id);
        await logAudit('Fornecedores', 'Excluir', `Fornecedor ${f?.nome || id} excluído`);
        renderFornecedores();
    } catch (err) {
        alert('Erro: ' + (err.message || err));
    }
}
