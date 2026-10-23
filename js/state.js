// --- CONEXÃO COM O SUPABASE (LK PNEUS) ---
const SUPABASE_URL = 'https://ggtzcxcjgzueuakoflzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndHpjeGNqZ3p1ZXVha29mbHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTI2OTEsImV4cCI6MjEwNzU2ODY5MX0.qzI9s6ikeV5boyphayEHOULAwcXUy4FIwn7driJ_KfI';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = sb;

// Estado em memória (espelho das tabelas para a UI)
let state = {
    pneus: [],
    veiculos: [],
    motoristas: [],
    fornecedores: [],
    ordens: [],
    auditoria: [],
    osCounter: 1001
};

let cloudReady = false;
let currentAuthUser = null;
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
            kind === 'saving' ? 'bg-amber-400' : 'bg-slate-400'
        );
    }
    if (icon) {
        icon.className = 'fa-solid ' + (
            kind === 'ok' ? 'fa-cloud' :
            kind === 'error' ? 'fa-cloud-bolt' :
            kind === 'saving' ? 'fa-cloud-arrow-up' : 'fa-cloud'
        );
    }
}

/** Carrega TODAS as tabelas do usuário autenticado (fonte da verdade = Supabase) */
async function loadAllTables() {
    if (!currentAuthUser) return;
    setCloudSyncStatus('saving', 'Carregando dados do Supabase...');
    const uid = currentAuthUser.id;

    const [veiculosRes, pneusRes, motoristasRes, fornecedoresRes, ordensRes, auditRes] = await Promise.all([
        sb.from('veiculos').select('*').eq('owner_id', uid).order('created_at', { ascending: false }),
        sb.from('pneus').select('*').eq('owner_id', uid).order('created_at', { ascending: false }),
        sb.from('motoristas').select('*').eq('owner_id', uid).order('created_at', { ascending: false }),
        sb.from('fornecedores').select('*').eq('owner_id', uid).order('created_at', { ascending: false }),
        sb.from('ordens_servico').select('*').eq('owner_id', uid).order('data', { ascending: false }),
        sb.from('auditoria').select('*').eq('owner_id', uid).order('data_hora', { ascending: false }).limit(500)
    ]);

    const fail = [veiculosRes, pneusRes, motoristasRes, fornecedoresRes, ordensRes, auditRes].find(r => r.error);
    if (fail) throw fail.error;

    // Normaliza nomes para compatibilidade com o HTML antigo
    state.veiculos = (veiculosRes.data || []).map(v => ({ ...v, totalPneus: v.total_pneus }));
    state.pneus = (pneusRes.data || []).map(p => ({
        ...p,
        sulcoAtual: p.sulco_atual,
        sulco: p.sulco_atual,
        veiculoId: p.veiculo_id,
        numero: p.fogo
    }));
    state.motoristas = motoristasRes.data || [];
    state.fornecedores = fornecedoresRes.data || [];
    state.ordens = (ordensRes.data || []).map(o => ({
        ...o,
        veiculo: o.veiculo_placa || o.veiculo,
        veiculoId: o.veiculo_id
    }));
    state.auditoria = (auditRes.data || []).map(a => ({
        ...a,
        dataHora: a.data_hora,
        time: a.data_hora
    }));

    const maxNum = state.ordens.reduce((m, o) => {
        const n = parseInt(String(o.numero || '').replace(/\D/g, ''), 10);
        return isNaN(n) ? m : Math.max(m, n);
    }, 1000);
    state.osCounter = maxNum + 1;

    cloudReady = true;
    setCloudSyncStatus('ok', 'Conectado ao Supabase · conta ' + (currentAuthUser.email || ''));
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
    if (typeof populateMapaVeiculoSelect === 'function') populateMapaVeiculoSelect();
    if (typeof renderVehicleMap === 'function') renderVehicleMap();
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

document.addEventListener('DOMContentLoaded', () => {
    bootstrapAuthAndCloud().catch(err => {
        console.error(err);
        setCloudSyncStatus('error', 'Falha ao conectar: ' + (err.message || err));
    });
});
