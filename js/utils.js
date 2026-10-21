// Funções Utilitárias e Formatadores
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
