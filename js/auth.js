let currentAuthUser = null;
let ALLOW_PUBLIC_REGISTRATION = false; // Mude para true se quiser permitir cadastro aberto

async function enterAuthenticatedApp(user) {
    currentAuthUser = user;
    currentUser = user.email;

    // Esconde a tela de login e mostra o painel principal
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-content').style.display = 'flex';

    // Atualiza o e-mail do usuário logado no menu lateral
    const userLabel = document.getElementById('logged-user-label');
    if (userLabel) userLabel.textContent = user.email;

    try {
        await loadCloudStateForUser(user);
        if (typeof refreshAllViews === 'function') refreshAllViews();
        setAuthMessage('Login efetuado com sucesso!', 'success');
    } catch (err) {
        console.error(err);
        if (typeof setCloudSyncStatus === 'function') {
            setCloudSyncStatus('error', 'Logado, mas falhou ao carregar dados: ' + (err.message || err));
        }
        setAuthMessage('Conta autenticada, porém houve erro ao carregar os dados da nuvem.', 'error');
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
    if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos. Confira os dados ou contate o administrador.';
    if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link enviado para ativar a conta.';
    if (/User already registered/i.test(msg)) return 'Esta conta já existe. Solicite o acesso ao administrador.';
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
        setAuthMessage('O cadastro público está desativado. Entre em contato com o suporte/administrador para contratar e liberar sua conta.', 'error');
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
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMessage('Cadastro enviado! Aguarde a liberação do seu plano para acessar.', 'success');
    } catch (error) {
        setAuthMessage(explainAuthOrDatabaseError(error), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-user-plus mr-2"></i>Criar conta';
    }
}

async function signOutUser() {
    if (cloudSaveTimer) {
        clearTimeout(cloudSaveTimer);
        cloudSaveTimer = null;
    }
    if (currentAuthUser && cloudReady) {
        while (cloudSaveInFlight) await new Promise(resolve => setTimeout(resolve, 50));
        try {
            await persistCloudState(JSON.stringify(state));
        } catch (err) {
            console.warn('Não foi possível salvar antes de sair:', err);
        }
    }
    await sb.auth.signOut();
    cloudReady = false;
    currentAuthUser = null;
    currentUser = 'Admin LK Pneus';

    document.getElementById('app-content').style.display = 'none';
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('auth-password').value = '';
    setAuthMessage('Você saiu da conta com segurança.', 'success');
    if (typeof setCloudSyncStatus === 'function') {
        setCloudSyncStatus('error', 'Desconectado do Supabase.');
    }
}
