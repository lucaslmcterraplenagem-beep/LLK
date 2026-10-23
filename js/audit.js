// Auditoria e Usuários – leitura 100% da tabela public.auditoria (Supabase)
// Usuário principal = conta autenticada (auth.users via currentAuthUser)

function renderUsuarios() {
    const container = document.getElementById('table-usuarios');
    if (!container) return;

    // Na arquitetura multi-tenant, cada conta autenticada é o "tenant".
    // Mostramos a conta logada como usuário principal.
    const rows = [];
    if (currentAuthUser) {
        rows.push({
            nome: (currentAuthUser.email || '').split('@')[0] || 'Usuário',
            email: currentAuthUser.email || '-',
            perfil: 'Administrador',
            status: 'Ativo',
            id: currentAuthUser.id
        });
    }

    if (rows.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">Nenhum usuário autenticado. Faça login.</td></tr>';
        return;
    }

    container.innerHTML = rows.map(u => `
        <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-slate-800">${escapeHtml(u.nome)}</td>
            <td class="p-3 text-slate-600">${escapeHtml(u.email)}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded">${escapeHtml(u.perfil)}</span></td>
            <td class="p-3">
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded">${escapeHtml(u.status)}</span>
            </td>
            <td class="p-3 text-right"><span class="text-xs text-slate-400 font-semibold">Principal</span></td>
        </tr>
    `).join('');
}

/**
 * Lista a trilha de auditoria já carregada em state.auditoria
 * (preenchida por loadAllTables + logAudit a cada ação).
 */
function renderAuditoria() {
    const tbody = document.getElementById('table-auditoria');
    if (!tbody) return;

    const modulo = document.getElementById('audit-filter-modulo')?.value || 'todos';
    const dataInicio = document.getElementById('audit-filter-inicio')?.value;
    const dataFim = document.getElementById('audit-filter-fim')?.value;

    let logs = state.auditoria || [];

    if (modulo !== 'todos') {
        logs = logs.filter(l => (l.modulo || '') === modulo);
    }
    if (dataInicio) {
        logs = logs.filter(l => (l.data_hora || l.dataHora || l.time || '') >= dataInicio);
    }
    if (dataFim) {
        logs = logs.filter(l => (l.data_hora || l.dataHora || l.time || '') <= dataFim + 'T23:59:59');
    }

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Nenhum registo encontrado para os filtros selecionados.</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map(l => `
        <tr class="hover:bg-slate-50 border-b border-slate-100 font-mono text-xs">
            <td class="p-3 text-slate-500 whitespace-nowrap">${escapeHtml(formatDate(l.data_hora || l.dataHora || l.time))}</td>
            <td class="p-3 font-semibold text-slate-700">${escapeHtml(l.usuario || 'Sistema')}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">${escapeHtml(l.modulo || '-')}</span></td>
            <td class="p-3 font-semibold text-emerald-700">${escapeHtml(l.acao || '')}</td>
            <td class="p-3 text-slate-600">${escapeHtml(l.detalhes || '')}</td>
        </tr>
    `).join('');
}

/** Recarrega auditoria direto do Supabase (útil após muitas ações ou em outra aba) */
async function refreshAuditoriaFromCloud() {
    if (!currentAuthUser) return;
    try {
        setCloudSyncStatus('saving', 'Atualizando auditoria...');
        const { data, error } = await sb.from('auditoria')
            .select('*')
            .eq('owner_id', currentAuthUser.id)
            .order('data_hora', { ascending: false })
            .limit(500);
        if (error) throw error;
        state.auditoria = (data || []).map(a => ({
            ...a,
            dataHora: a.data_hora,
            time: a.data_hora
        }));
        renderAuditoria();
        setCloudSyncStatus('ok', 'Auditoria atualizada do Supabase');
    } catch (err) {
        console.warn('Falha ao recarregar auditoria:', err);
        setCloudSyncStatus('error', 'Erro ao carregar auditoria: ' + (err.message || err));
    }
}
