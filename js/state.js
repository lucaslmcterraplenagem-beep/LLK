// --- CONEXÃO COM O SUPABASE (LK PNEUS) ---
const SUPABASE_URL = 'https://ggtzcxcjgzueuakoflzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndHpjeGNqZ3p1ZXVha29mbHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTI2OTEsImV4cCI6MjEwNzU2ODY5MX0.qzI9s6ikeV5boyphayEHOULAwcXUy4FIwn7driJ_KfI';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Alias para outros arquivos que usam window.supabaseClient
window.supabaseClient = sb;

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

function setCloudSyncStatus(kind, message) {
    const label = document.getElementById('cloud-sync-label');
    const dot = document.getElementById('cloud-sync-dot');
    const icon = document.getElementById('cloud-sync-icon');
    if (!label) return;

    label.textContent = message;

    if (dot) {
        dot.className = 'h-2 w-2 rounded-full ' + (
            kind === 'ok' ? 'bg-emerald-500' :
            kind === 'error' ? 'bg-red-500' :
            kind === 'saving' ? 'bg-amber-400' :
            'bg-slate-400'
        );
    }
    if (icon) {
        icon.className = 'fa-solid ' + (
            kind === 'ok' ? 'fa-cloud' :
            kind === 'error' ? 'fa-cloud-bolt' :
            kind === 'saving' ? 'fa-cloud-arrow-up' :
            'fa-cloud'
        );
    }
}

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

function queueCloudSave(serialized) {
    if (!cloudReady || !currentAuthUser) return;
    pendingCloudSnapshot = serialized;
    if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => {
        cloudSaveTimer = null;
        flushCloudSave();
    }, 600);
}

async function flushCloudSave() {
    if (!cloudReady || !currentAuthUser || cloudSaveInFlight) return;
    if (pendingCloudSnapshot == null) return;

    const snapshot = pendingCloudSnapshot;
    pendingCloudSnapshot = null;
    cloudSaveInFlight = true;
    setCloudSyncStatus('saving', 'Salvando no Supabase...');

    try {
        await persistCloudState(snapshot);
        setCloudSyncStatus('ok', 'Conectado ao Supabase · dados sincronizados');
    } catch (err) {
        console.error('Erro ao salvar na nuvem:', err);
        setCloudSyncStatus('error', 'Erro ao salvar no Supabase: ' + (err.message || err));
        pendingCloudSnapshot = snapshot;
    } finally {
        cloudSaveInFlight = false;
        if (pendingCloudSnapshot != null) queueCloudSave(pendingCloudSnapshot);
    }
}

async function persistCloudState(serialized) {
    const parsed = JSON.parse(serialized);
    const userId = currentAuthUser.id;

    const { error } = await sb
        .from('lk_pneus_state')
        .upsert({
            user_id: userId,
            state: parsed,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) throw error;
}

async function loadCloudStateForUser(user) {
    setCloudSyncStatus('saving', 'Carregando dados do Supabase...');

    STORAGE_KEY = 'llk-system-state-v4:' + user.id;

    const { data, error } = await sb
        .from('lk_pneus_state')
        .select('state')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) throw error;

    if (data && data.state && typeof data.state === 'object') {
        state = { ...state, ...data.state };
        ['pneus','veiculos','motoristas','fornecedores','usuarios','ordens','auditoria','movimentacoes'].forEach(k => {
            if (!Array.isArray(state[k])) state[k] = [];
        });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) { /* ignore */ }
    } else {
        // Primeira vez: sobe o estado local atual para a nuvem
        loadState();
        await persistCloudState(JSON.stringify(state));
    }

    cloudReady = true;
    setCloudSyncStatus('ok', 'Conectado ao Supabase · conta ' + (user.email || ''));
}

function refreshAllViews() {
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    if (typeof renderTireList === 'function') renderTireList();
    if (typeof renderVehicleList === 'function') renderVehicleList();
    if (typeof renderOrderList === 'function') renderOrderList();
    if (typeof renderVeiculos === 'function') renderVeiculos();
    if (typeof renderMotoristas === 'function') renderMotoristas();
    if (typeof renderFornecedores === 'function') renderFornecedores();
    if (typeof renderUsuarios === 'function') renderUsuarios();
    if (typeof renderAuditoria === 'function') renderAuditoria();
}

async function bootstrapAuthAndCloud() {
    setCloudSyncStatus('saving', 'Conectando ao Supabase...');

    const { data: { session }, error } = await sb.auth.getSession();
    if (error) {
        console.error(error);
        setCloudSyncStatus('error', 'Erro de autenticação: ' + error.message);
        return;
    }

    if (session && session.user) {
        await enterAuthenticatedApp(session.user);
    } else {
        setCloudSyncStatus('error', 'Faça login para sincronizar com o Supabase.');
        document.getElementById('auth-screen')?.classList.remove('hidden');
        const app = document.getElementById('app-content');
        if (app) app.style.display = 'none';
    }

    sb.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            cloudReady = false;
            setCloudSyncStatus('error', 'Desconectado do Supabase.');
            return;
        }
        if (session && session.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
            if (!currentAuthUser || currentAuthUser.id !== session.user.id) {
                await enterAuthenticatedApp(session.user);
            }
        }
    });
}

// Inicia quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    bootstrapAuthAndCloud().catch(err => {
        console.error(err);
        setCloudSyncStatus('error', 'Falha ao conectar: ' + (err.message || err));
    });
});
