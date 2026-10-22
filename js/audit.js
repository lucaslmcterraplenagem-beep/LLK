// Módulo de Auditoria e Gestão de Utilizadores
function renderUsuarios() {
    const container = document.getElementById('table-usuarios');
    if (!container) return;

    container.innerHTML = state.usuarios.map(u => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-slate-800">${escapeHtml(u.nome)}</td>
            <td class="p-3 text-slate-600">${escapeHtml(u.email)}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded">${escapeHtml(u.perfil)}</span></td>
            <td class="p-3">
                <span class="px-2 py-0.5 ${(u.status || '').toLowerCase().includes('pendente') ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'} font-semibold text-xs rounded">${escapeHtml(u.status || 'Ativo')}</span>
            </td>
            <td class="p-3 text-right">
                ${u.id !== 1 ? `<button onclick="deleteUsuario('${u.id}')" class="text-slate-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>` : '<span class="text-xs text-slate-400 font-semibold">Principal</span>'}
            </td>
        </tr>
    `).join('');
}

function renderAuditoria() {
    const tbody = document.getElementById('table-auditoria');
    if (!tbody) return;

    const modulo = document.getElementById('audit-filter-modulo')?.value || 'todos';
    const dataInicio = document.getElementById('audit-filter-inicio')?.value;
    const dataFim = document.getElementById('audit-filter-fim')?.value;

    let logs = state.auditoria || [];

    // Filtro por módulo/tabela
    if (modulo !== 'todos') {
        logs = logs.filter(l => l.modulo === modulo);
    }

    // Filtro por datas
    if (dataInicio) {
        logs = logs.filter(l => (l.dataHora || l.time || '') >= dataInicio);
    }
    if (dataFim) {
        logs = logs.filter(l => (l.dataHora || l.time || '') <= dataFim + 'T23:59:59');
    }

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Nenhum registo encontrado para os filtros selecionados.</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map(l => `
        <tr class="hover:bg-slate-50 border-b border-slate-100 font-mono text-xs">
            <td class="p-3 text-slate-500 whitespace-nowrap">${escapeHtml(l.dataHora || l.time || '')}</td>
            <td class="p-3 font-semibold text-slate-700">${escapeHtml(l.usuario || 'Sistema')}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">${escapeHtml(l.modulo || '-')}</span></td>
            <td class="p-3 font-semibold text-emerald-700">${escapeHtml(l.acao || '')}</td>
            <td class="p-3 text-slate-600">${escapeHtml(l.detalhes || '')}</td>
        </tr>
    `).join('');
}
