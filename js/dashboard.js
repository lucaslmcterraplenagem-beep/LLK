// Módulo do Dashboard e Métricas da Frota
function updateDashboardMetrics() {
    const total = state.pneus.length;
    const emUso = state.pneus.filter(p => p.status === 'Em Uso' || p.veiculoId || (p.veiculo && p.veiculo !== 'Estoque')).length;
    const alerta = state.pneus.filter(p => Number(p.sulco) >= 1.6 && Number(p.sulco) <= 3).length;
    const critico = state.pneus.filter(p => Number(p.sulco) < 1.6).length;
    const gastos = state.ordens.reduce((sum, o) => sum + (Number(o.valor) || 0), 0);
    const estoque = state.pneus.filter(p => !p.veiculoId && (!p.veiculo || p.veiculo === 'Estoque') && p.status === 'Estoque').length;

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set('metric-total', total);
    set('metric-emuso', emUso);
    set('metric-alerta', alerta);
    set('metric-critico', critico);
    set('metric-gastos', money(gastos));
    set('metric-ordens', state.ordens.length);
    set('metric-estoque', estoque);
}

function populateDashboardFilters() {
    const yearEl = document.getElementById('dashboard-filter-year');
    const catEl = document.getElementById('dashboard-filter-categoria');
    const vehEl = document.getElementById('dashboard-filter-veiculo');
    if (!yearEl || !catEl || !vehEl) return;

    const years = [...new Set(state.ordens.map(o => (o.data || '').slice(0, 4)).filter(y => /^\d{4}$/.test(y)))].sort().reverse();
    yearEl.innerHTML = '<option value="todos">Todos</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
    
    const cats = [...new Set(state.ordens.map(o => o.categoriaVeiculo).filter(Boolean))].sort();
    catEl.innerHTML = '<option value="todos">Todas</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    const vehs = [...new Set(state.ordens.map(o => o.veiculo).filter(Boolean))].sort();
    vehEl.innerHTML = '<option value="todos">Todos</option>' + vehs.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
}
