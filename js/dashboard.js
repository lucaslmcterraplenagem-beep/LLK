// Dashboard + navegação de abas – métricas 100% a partir dos dados carregados do Supabase

function switchTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('bg-slate-800', 'text-white');
        nav.classList.add('text-slate-300');
    });

    if (element) {
        element.classList.add('bg-slate-800', 'text-white');
        element.classList.remove('text-slate-300');
    }

    // Atualiza dados ao trocar de aba (fonte = state já carregado do Supabase)
    if (tabId === 'dashboard' && typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    if (tabId === 'pneus' && typeof renderTireList === 'function') renderTireList();
    if (tabId === 'cadastros') {
        if (typeof renderVeiculos === 'function') renderVeiculos();
        if (typeof renderMotoristas === 'function') renderMotoristas();
        if (typeof renderFornecedores === 'function') renderFornecedores();
    }
    if (tabId === 'ordens' && typeof renderOrderList === 'function') renderOrderList();
    if (tabId === 'usuarios' && typeof renderUsuarios === 'function') renderUsuarios();
    if (tabId === 'auditoria' && typeof renderAuditoria === 'function') renderAuditoria();
}

/**
 * Métricas do painel.
 * Sulco vem SEMPRE de sulco_atual (coluna real no Supabase).
 * Em Uso = status "Em Uso" OU tem veiculo_id preenchido.
 * Estoque = status Estoque/Stock e sem veiculo_id.
 */
function updateDashboardMetrics() {
    const pneus = state.pneus || [];
    const total = pneus.length;

    const emUso = pneus.filter(p => {
        const st = (p.status || '').toLowerCase();
        return st === 'em uso' || p.veiculo_id || p.veiculoId;
    }).length;

    const getSulco = p => Number(
        p.sulco_atual != null ? p.sulco_atual :
        (p.sulcoAtual != null ? p.sulcoAtual : p.sulco)
    );

    const alerta = pneus.filter(p => {
        const n = getSulco(p);
        return !isNaN(n) && n >= 1.6 && n <= 3;
    }).length;

    const critico = pneus.filter(p => {
        const n = getSulco(p);
        return !isNaN(n) && n < 1.6;
    }).length;

    const gastos = (state.ordens || []).reduce((sum, o) => sum + (Number(o.valor) || 0), 0);

    const estoque = pneus.filter(p => {
        const st = (p.status || '').toLowerCase();
        return (st === 'estoque' || st === 'stock') && !p.veiculo_id && !p.veiculoId;
    }).length;

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set('metric-total', total);
    set('metric-emuso', emUso);
    set('metric-alerta', alerta);
    set('metric-critico', critico);
    set('metric-gastos', money(gastos));
    set('metric-ordens', (state.ordens || []).length);
    set('metric-estoque', estoque);
}

function populateDashboardFilters() {
    const yearEl = document.getElementById('dashboard-filter-year');
    const catEl = document.getElementById('dashboard-filter-categoria');
    const vehEl = document.getElementById('dashboard-filter-veiculo');
    if (!yearEl || !catEl || !vehEl) return;

    const years = [...new Set(
        (state.ordens || [])
            .map(o => (o.data || '').toString().slice(0, 4))
            .filter(y => /^\d{4}$/.test(y))
    )].sort().reverse();
    yearEl.innerHTML = '<option value="todos">Todos</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('');

    const cats = [...new Set(
        (state.ordens || []).map(o => o.categoriaVeiculo).filter(Boolean)
    )].sort();
    catEl.innerHTML = '<option value="todos">Todas</option>' +
        cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    const vehs = [...new Set(
        (state.ordens || []).map(o => o.veiculo || o.veiculo_placa).filter(Boolean)
    )].sort();
    vehEl.innerHTML = '<option value="todos">Todos</option>' +
        vehs.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
}
