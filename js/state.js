// --- CONEXÃO COM O SUPABASE (LK PNEUS) ---
const SUPABASE_URL = 'https://ggtzcxcjgzueuakoflzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndHpjeGNqZ3p1ZXVha29mbHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTI2OTEsImV4cCI6MjEwNzU2ODY5MX0.qzI9s6ikeV5boyphayEHOULAwcXUy4FIwn7driJ_KfI';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Estado Global do Sistema
const LEGACY_STORAGE_KEY = 'llk-system-state-v3';
let STORAGE_KEY = 'llk-system-state-v4:pending';

let state = {
    pneus: [], veiculos: [], motoristas: [], fornecedores: [],
    usuarios: [{ id: 1, nome: 'Admin LK Pneus', email: 'admin@llk.com', perfil: 'Administrador', status: 'Ativo', conviteEnviado: false }],
    ordens: [], auditoria: [], movimentacoes: [], osCounter: 1001
};

let cloudReady = false;
let cloudSaveTimer = null;
let cloudSaveInFlight = false;
let pendingCloudSnapshot = null;
let currentUser = 'Admin LK Pneus';
const chartInstances = {};

function loadState() {
    let saved = null;
    try {
        saved = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
        console.warn('Não foi possível ler o armazenamento local.', err);
    }
    if (saved) {
        try { state = { ...state, ...JSON.parse(saved) }; }
        catch (err) { console.warn('Estado salvo corrompido, iniciando limpo.', err); }
    }
    ['pneus','veiculos','motoristas','fornecedores','usuarios','ordens','auditoria','movimentacoes'].forEach(k => { 
        if (!Array.isArray(state[k])) state[k] = []; 
    });
}

function saveState() {
    const serialized = JSON.stringify(state);
    queueCloudSave(serialized);
    try {
        localStorage.setItem(STORAGE_KEY, serialized);
        return true;
    } catch (err) {
        console.warn('Falha ao salvar no armazenamento local.', err);
        return false;
    }
}
