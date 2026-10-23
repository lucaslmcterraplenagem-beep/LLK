let ALLOW_PUBLIC_REGISTRATION = false; // true = permite cadastro aberto pelo formulário

async function enterAuthenticatedApp(user) {
    currentAuthUser = user;
    currentUser = user.email;
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-content').style.display = 'flex';
    const userLabel = document.getElementById('logged-user-label');
    if (userLabel) userLabel.textContent = user.email;
    try {
        await loadAllTables();
        if (typeof refreshAllViews === 'function') refreshAllViews();
        setAuthMessage('Login efetuado com sucesso!', 'success');
    } catch (err) {
        console.error(err);
        setCloudSyncStatus('error', 'Logado, mas falhou ao carregar dados: ' + (err.message || err));
        setAuthMessage('Conta autenticada, porém houve erro ao carregar os dados da nuvem. Execute o supabase-setup.sql se ainda não rodou.', 'error');
        if (typeof refreshAllViews === 'function') refreshAllViews();
    }
}

function setAuthMessage(message, kind = 'info') {
    const el = document.getElementById('auth-message');
    if (!el) return;
    el.textContent = message;
    el.className = 'mt-4 rounded-lg border p-3 text-sm ' + (kind === 'error'
        ? 'border-red-200 bg-red-50 text-red-800'
        : kind === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-slate-50 text-slate-700');
    el.classList.remove('hidden');
}

function explainAuthOrDatabaseError(error) {
    const msg = String(error?.message || error || 'Erro inesperado.');
    if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link enviado.';
    if (/User already registered/i.test(msg)) return 'Esta conta já existe.';
    if (/relation .* does not exist/i.test(msg)) return 'Tabelas ainda não criadas. Execute o arquivo supabase-setup.sql no SQL Editor do Supabase.';
    return msg;
}

async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const password = document.getElementById('auth-password').value;
    const button = document.getElementById('auth-sign-in');
    button.disabled = true;
    button.textContent = 'Autenticando...';
    try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error('Não foi possível autenticar o usuário.');
        await enterAuthenticatedApp(data.user);
    } catch (error) {
        setAuthMessage(explainAuthOrDatabaseError(error), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-2"></i>Entrar';
    }
}

async function createAuthAccount() {
    if (!ALLOW_PUBLIC_REGISTRATION) {
        setAuthMessage('O cadastro público está desativado. Contate o administrador.', 'error');
        return;
    }
    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const password = document.getElementById('auth-password').value;
    if (!email || !password || password.length < 8) {
        setAuthMessage('Informe o e-mail e uma senha de pelo menos 8 caracteres.', 'error');
        return;
    }
    const button = document.getElementById('auth-sign-up');
    button.disabled = true;
    button.textContent = 'Solicitando acesso...';
    try {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMessage('Cadastro enviado! Aguarde liberação.', 'success');
    } catch (error) {
        setAuthMessage(explainAuthOrDatabaseError(error), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-user-plus mr-2"></i>Criar conta';
    }
}

async function signOutUser() {
    await sb.auth.signOut();
    cloudReady = false;
    currentAuthUser = null;
    currentUser = 'Admin LK Pneus';
    state = { pneus: [], veiculos: [], motoristas: [], fornecedores: [], ordens: [], auditoria: [], osCounter: 1001 };
    document.getElementById('app-content').style.display = 'none';
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('auth-password').value = '';
    setAuthMessage('Você saiu da conta com segurança.', 'success');
    setCloudSyncStatus('error', 'Desconectado do Supabase.');
}
