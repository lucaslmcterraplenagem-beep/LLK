function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function money(value) {
    return (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function whenNowLocal() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}
function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return isNaN(d) ? value : d.toLocaleString('pt-BR');
}
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

/** Grava linha na tabela auditoria (Supabase) a cada ação importante */
async function logAudit(modulo, acao, detalhes) {
    if (!currentAuthUser || !sb) return;
    try {
        await sb.from('auditoria').insert({
            owner_id: currentAuthUser.id,
            usuario: currentAuthUser.email || currentUser || 'Sistema',
            modulo: modulo || '-',
            acao: acao || '',
            detalhes: detalhes || ''
        });
        if (Array.isArray(state.auditoria)) {
            state.auditoria.unshift({
                data_hora: new Date().toISOString(),
                usuario: currentAuthUser.email || currentUser,
                modulo, acao, detalhes
            });
        }
    } catch (err) {
        console.warn('Falha ao gravar auditoria:', err);
    }
}
