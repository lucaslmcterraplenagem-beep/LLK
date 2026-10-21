// Módulo de Ordens de Serviço e Movimentações
function renderOrderList() {
    const container = document.getElementById('table-ordens');
    if (!container) return;
    
    if (state.ordens.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400">Nenhuma Ordem de Serviço emitida.</td></tr>`;
        return;
    }

    container.innerHTML = state.ordens.map(o => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-emerald-700">${escapeHtml(o.numero)}</td>
            <td class="p-3 whitespace-nowrap">${escapeHtml(formatDate(o.data))}</td>
            <td class="p-3 font-semibold">${escapeHtml(o.veiculo)}</td>
            <td class="p-3">${escapeHtml(o.fornecedor || 'Oficina Interna')}</td>
            <td class="p-3"><span class="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">${escapeHtml(o.tipo)}</span></td>
            <td class="p-3 font-bold text-slate-800">${money(o.valor)}</td>
            <td class="p-3 text-right">
                <button onclick="viewOrderDetails('${o.id}')" title="Detalhes" class="text-emerald-600 hover:text-emerald-800 mr-2"><i class="fa-solid fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
}

function saveOrder(event) {
    event.preventDefault();
    const numero = document.getElementById('os-numero').value;
    const veiculoId = document.getElementById('os-veiculo').value;
    const tipo = document.getElementById('os-tipo').value;
    const valor = Number(document.getElementById('os-valor').value) || 0;
    const km = Number(document.getElementById('os-km').value) || 0;

    const veiculo = state.veiculos.find(v => v.id === veiculoId);
    if (!veiculo) {
        alert('Selecione um veículo válido.');
        return;
    }

    const novaOrdem = {
        id: 'os_' + Date.now(),
        numero,
        data: document.getElementById('os-data').value || new Date().toISOString(),
        veiculoId,
        veiculo: veiculo.placa,
        tipo,
        valor,
        km,
        status: document.getElementById('os-status').value,
        obs: document.getElementById('os-obs').value
    };

    state.ordens.unshift(novaOrdem);
    state.osCounter++;
    saveState();
    renderOrderList();
    
    alert('Ordem de Serviço emitida com sucesso!');
}

function viewOrderDetails(id) {
    const o = state.ordens.find(item => item.id === id);
    if (!o) return;
    alert(`Detalhes da OS: ${o.numero}\nVeículo: ${o.veiculo}\nTipo: ${o.tipo}\nValor: ${money(o.valor)}`);
}
