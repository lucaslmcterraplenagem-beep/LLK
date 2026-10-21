// Módulo de Cadastros Gerais (Veículos, Motoristas e Fornecedores)
function renderVeiculos() {
    const container = document.getElementById('table-veiculos');
    if (!container) return;
    
    if (state.veiculos.length === 0) {
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
    
    if (state.motoristas.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">Nenhum motorista/colaborador cadastrado.</td></tr>';
        return;
    }

    container.innerHTML = state.motoristas.map(m => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-slate-800">${escapeHtml(m.nome)}<div class="text-[10px] text-slate-400">${escapeHtml(m.funcao || 'Motorista')}</div></td>
            <td class="p-3">${escapeHtml(m.cpf)}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 font-medium text-xs rounded">${escapeHtml(m.cnh || 'Não se aplica')}</span></td>
            <td class="p-3">${escapeHtml(m.fone || '-')}</td>
            <td class="p-3 text-right"><button onclick="deleteMotorista('${m.id}')" class="text-slate-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function renderFornecedores() {
    const container = document.getElementById('table-fornecedores');
    if (!container) return;
    
    if (state.fornecedores.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">Nenhum fornecedor cadastrado.</td></tr>';
        return;
    }

    container.innerHTML = state.fornecedores.map(f => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-slate-800">${escapeHtml(f.nome)}</td>
            <td class="p-3 font-mono text-xs">${escapeHtml(f.cnpj)}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-medium text-xs rounded">${escapeHtml(f.tipo)}</span></td>
            <td class="p-3">${escapeHtml(f.fone || '-')}</td>
            <td class="p-3 text-right"><button onclick="deleteFornecedor('${f.id}')" class="text-slate-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');
}
