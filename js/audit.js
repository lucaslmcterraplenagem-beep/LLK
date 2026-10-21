// Módulo de Auditoria e Gestão de Utilizadores
function renderUsuarios() {
    const container = document.getElementById('table-usuarios');
    if (!container) return;
    
    container.innerHTML = state.usuarios.map(u => {
        const pending = (u.status || '').toLowerCase().includes('pendente');
        return `
            <tr class="hover:bg-slate-50">
                <td class="p-3 font-bold text-slate-800">${escapeHtml(u.nome)}</td>
                <td class="p-3 text-slate-600">${escapeHtml(u.email)}</td>
                <td class="p-3"><span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded">${escapeHtml(u.perfil)}</span></td>
                <td class="p-3">
                    <span class="px-2 py-0.5 ${pending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'} font-semibold text-xs rounded-full">● ${escapeHtml(u.status || 'Ativo')}</span>
                </td>
                <td class="p-3 text-right">
                    ${u.id !== 1 ? `<button onclick="deleteUsuario('${u.id}')" class="text-slate-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>` : '<span class="text-xs text-slate-400 font-semibold">Principal</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

function renderAuditoria() {
    const container = document.getElementById('table-auditoria');
    if (!container) return;
    
    if (state.auditoria.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">Sem registos na trilha de auditoria.</td></tr>';
        return;
    }

    container.innerHTML = state.auditoria.map(a => `
        <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="p-3 text-slate-500 whitespace-nowrap">${escapeHtml(a.time)}</td>
            <td class="p-3 font-bold text-slate-700">${escapeHtml(a.usuario)}</td>
            <td class="p-3"><span class="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">${escapeHtml(a.modulo)}</span></td>
            <td class="p-3 font-semibold text-emerald-600">${escapeHtml(a.acao)}</td>
            <td class="p-3 text-slate-600">${escapeHtml(a.detalhes)}</td>
        </tr>
    `).join('');
}

function clearAuditLog() {
    if (!confirm('Deseja realmente limpar o histórico de auditoria?')) return;
    state.auditoria = [];
    saveState();
    renderAuditoria();
}
