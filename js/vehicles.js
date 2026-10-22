// Módulo de Veículos e Mapa de Pneus — usa state + saveState (Supabase via lk_pneus_state)

const VEHICLE_PRESETS = {
    'truck-6x2': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Intermediário', esq: 2, dir: 2 },
        { nome: 'Traseiro', esq: 2, dir: 2 }
    ],
    'truck-6x4': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Tração 1', esq: 2, dir: 2 },
        { nome: 'Tração 2', esq: 2, dir: 2 }
    ],
    'cavalo-4x2': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Traseiro', esq: 2, dir: 2 }
    ],
    'cavalo-6x2': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Intermediário', esq: 2, dir: 2 },
        { nome: 'Traseiro', esq: 2, dir: 2 }
    ],
    'cavalo-6x4': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Tração 1', esq: 2, dir: 2 },
        { nome: 'Tração 2', esq: 2, dir: 2 }
    ],
    'bitruck-8x2': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Eixo 2', esq: 1, dir: 1 },
        { nome: 'Eixo 3', esq: 2, dir: 2 },
        { nome: 'Eixo 4', esq: 2, dir: 2 }
    ],
    'bitruck-8x4': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Eixo 2', esq: 1, dir: 1 },
        { nome: 'Tração 1', esq: 2, dir: 2 },
        { nome: 'Tração 2', esq: 2, dir: 2 }
    ],
    '4x2-4': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Traseiro', esq: 1, dir: 1 }
    ],
    '4x4-4': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Traseiro', esq: 1, dir: 1 }
    ],
    '6x6': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Intermediário', esq: 2, dir: 2 },
        { nome: 'Traseiro', esq: 2, dir: 2 }
    ],
    '8x8': [
        { nome: 'Eixo 1', esq: 2, dir: 2 },
        { nome: 'Eixo 2', esq: 2, dir: 2 },
        { nome: 'Eixo 3', esq: 2, dir: 2 },
        { nome: 'Eixo 4', esq: 2, dir: 2 }
    ],
    'semi-2': [
        { nome: 'Eixo 1', esq: 2, dir: 2 },
        { nome: 'Eixo 2', esq: 2, dir: 2 }
    ],
    'semi-3': [
        { nome: 'Eixo 1', esq: 2, dir: 2 },
        { nome: 'Eixo 2', esq: 2, dir: 2 },
        { nome: 'Eixo 3', esq: 2, dir: 2 }
    ],
    'semi-4': [
        { nome: 'Eixo 1', esq: 2, dir: 2 },
        { nome: 'Eixo 2', esq: 2, dir: 2 },
        { nome: 'Eixo 3', esq: 2, dir: 2 },
        { nome: 'Eixo 4', esq: 2, dir: 2 }
    ],
    'agricola-4x4': [
        { nome: 'Dianteiro', esq: 1, dir: 1 },
        { nome: 'Traseiro', esq: 1, dir: 1 }
    ],
    'personalizada': [
        { nome: 'Eixo 1', esq: 1, dir: 1 }
    ]
};

let editingAxles = [];

function cloneAxles(axles) {
    return (axles || []).map(a => ({
        nome: a.nome || 'Eixo',
        esq: Number(a.esq) || 1,
        dir: Number(a.dir) || 1
    }));
}

function countMountedTires(axles) {
    return (axles || []).reduce((sum, a) => sum + (Number(a.esq) || 0) + (Number(a.dir) || 0), 0);
}

function updateVehiclePreview() {
    const mounted = countMountedTires(editingAxles);
    const spare = Math.max(0, Number(document.getElementById('veiculo-estepe')?.value) || 0);
    const elTire = document.getElementById('vehicle-tire-total');
    const elSpare = document.getElementById('vehicle-spare-total');
    const elAll = document.getElementById('vehicle-all-total');
    if (elTire) elTire.textContent = String(mounted);
    if (elSpare) elSpare.textContent = String(spare);
    if (elAll) elAll.textContent = String(mounted + spare);
}

function renderAxleEditor() {
    const box = document.getElementById('vehicle-axle-editor');
    if (!box) return;

    if (!editingAxles.length) {
        box.innerHTML = '<p class="text-xs text-slate-400">Nenhum eixo. Clique em “Adicionar eixo” ou escolha uma configuração.</p>';
        updateVehiclePreview();
        return;
    }

    box.innerHTML = editingAxles.map((a, idx) => `
        <div class="axle-editor-row">
            <div>
                <label class="soft-label">Nome do eixo</label>
                <input type="text" class="field-control" value="${escapeHtml(a.nome)}" oninput="editingAxles[${idx}].nome=this.value">
            </div>
            <div>
                <label class="soft-label">Pneus esq / dir</label>
                <div class="flex gap-2">
                    <input type="number" min="0" max="4" class="field-control" value="${Number(a.esq) || 0}" oninput="editingAxles[${idx}].esq=Number(this.value)||0;updateVehiclePreview()">
                    <input type="number" min="0" max="4" class="field-control" value="${Number(a.dir) || 0}" oninput="editingAxles[${idx}].dir=Number(this.value)||0;updateVehiclePreview()">
                </div>
            </div>
            <div class="text-xs text-slate-500 pb-2">Total eixo: <strong>${(Number(a.esq)||0)+(Number(a.dir)||0)}</strong></div>
            <button type="button" class="text-red-500 hover:text-red-700 pb-2" title="Remover eixo" onclick="removeVehicleAxle(${idx})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');

    updateVehiclePreview();
}

function addVehicleAxle() {
    editingAxles.push({ nome: 'Eixo ' + (editingAxles.length + 1), esq: 1, dir: 1 });
    const cfg = document.getElementById('veiculo-config');
    if (cfg) cfg.value = 'personalizada';
    renderAxleEditor();
}

function removeVehicleAxle(idx) {
    editingAxles.splice(idx, 1);
    const cfg = document.getElementById('veiculo-config');
    if (cfg) cfg.value = 'personalizada';
    renderAxleEditor();
}

function applyVehiclePreset() {
    const key = document.getElementById('veiculo-config')?.value || 'truck-6x2';
    const preset = VEHICLE_PRESETS[key] || VEHICLE_PRESETS['truck-6x2'];
    editingAxles = cloneAxles(preset);
    renderAxleEditor();
}

function resetVeiculoForm() {
    const form = document.getElementById('form-veiculo');
    if (form) form.reset();
    const editId = document.getElementById('veiculo-edit-id');
    if (editId) editId.value = '';
    const title = document.getElementById('veiculo-modal-title');
    if (title) title.textContent = 'Cadastrar Novo Veículo';
    const cfg = document.getElementById('veiculo-config');
    if (cfg) cfg.value = 'truck-6x2';
    const estepe = document.getElementById('veiculo-estepe');
    if (estepe) estepe.value = '1';
    applyVehiclePreset();
}

function openNewVeiculoModal() {
    resetVeiculoForm();
    openModal('modal-veiculo');
}

// Sobrescreve o botão "Novo Veículo" se ele só chama openModal
document.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.getAttribute('onclick') === "openModal('modal-veiculo')") {
        e.preventDefault();
        openNewVeiculoModal();
    }
});

function handleSaveVeiculo(event) {
    event.preventDefault();

    const editId = (document.getElementById('veiculo-edit-id')?.value || '').trim();
    const prefixo = (document.getElementById('veiculo-prefixo')?.value || '').trim();
    const placa = (document.getElementById('veiculo-placa')?.value || '').trim().toUpperCase();
    const ano = (document.getElementById('veiculo-ano')?.value || '').trim();
    const modelo = (document.getElementById('veiculo-modelo')?.value || '').trim();
    const categoria = document.getElementById('veiculo-categoria')?.value || '';
    const config = document.getElementById('veiculo-config')?.value || 'personalizada';
    const km = Number(document.getElementById('veiculo-km')?.value) || 0;
    const chassi = (document.getElementById('veiculo-chassi')?.value || '').trim().toUpperCase();
    const estepe = Math.max(0, Number(document.getElementById('veiculo-estepe')?.value) || 0);

    if (!placa || !modelo || !categoria) {
        alert('Preencha placa, modelo e categoria.');
        return;
    }
    if (!editingAxles.length) {
        alert('Configure pelo menos um eixo.');
        return;
    }

    const eixos = cloneAxles(editingAxles);
    const payload = {
        prefixo,
        placa,
        ano,
        modelo,
        categoria,
        config,
        km,
        chassi,
        estepe,
        eixos,
        totalPneus: countMountedTires(eixos) + estepe
    };

    if (editId) {
        const idx = state.veiculos.findIndex(v => String(v.id) === String(editId));
        if (idx === -1) {
            alert('Veículo não encontrado para edição.');
            return;
        }
        state.veiculos[idx] = { ...state.veiculos[idx], ...payload, id: state.veiculos[idx].id };
    } else {
        const id = 'v_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        state.veiculos.push({ id, ...payload });
    }

    if (!Array.isArray(state.veiculos)) state.veiculos = [];

    saveState();
    refreshVehicleUI();
    closeModal('modal-veiculo');
    resetVeiculoForm();
    alert(editId ? 'Veículo atualizado e sincronizado.' : 'Veículo cadastrado e sincronizado com o Supabase.');
}

function editVeiculo(id) {
    const v = state.veiculos.find(item => String(item.id) === String(id));
    if (!v) {
        alert('Veículo não encontrado.');
        return;
    }

    document.getElementById('veiculo-edit-id').value = v.id;
    document.getElementById('veiculo-prefixo').value = v.prefixo || '';
    document.getElementById('veiculo-placa').value = v.placa || '';
    document.getElementById('veiculo-ano').value = v.ano || '';
    document.getElementById('veiculo-modelo').value = v.modelo || '';
    document.getElementById('veiculo-categoria').value = v.categoria || 'Caminhão truck';
    document.getElementById('veiculo-config').value = v.config || 'personalizada';
    document.getElementById('veiculo-km').value = v.km != null ? v.km : 0;
    document.getElementById('veiculo-chassi').value = v.chassi || '';
    document.getElementById('veiculo-estepe').value = v.estepe != null ? v.estepe : 1;

    const title = document.getElementById('veiculo-modal-title');
    if (title) title.textContent = 'Editar Veículo';

    if (Array.isArray(v.eixos) && v.eixos.length) {
        editingAxles = cloneAxles(v.eixos);
        renderAxleEditor();
    } else {
        applyVehiclePreset();
    }

    openModal('modal-veiculo');
}

function deleteVeiculo(id) {
    if (!confirm('Deseja realmente excluir este veículo?')) return;

    state.veiculos = state.veiculos.filter(v => String(v.id) !== String(id));

    // Libera pneus que estavam nesse veículo
    state.pneus = (state.pneus || []).map(p => {
        if (String(p.veiculoId) === String(id)) {
            return {
                ...p,
                veiculoId: null,
                veiculo: 'Estoque',
                posicao: null,
                status: p.status === 'Em Uso' ? 'Estoque' : (p.status || 'Estoque')
            };
        }
        return p;
    });

    saveState();
    refreshVehicleUI();
}

function refreshVehicleUI() {
    if (typeof renderVeiculos === 'function') renderVeiculos();
    if (typeof renderVehicleList === 'function') renderVehicleList();
    populateMapaVeiculoSelect();
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    renderVehicleMap();
}

function populateMapaVeiculoSelect() {
    const sel = document.getElementById('mapa-veiculo-select');
    if (!sel) return;
    const current = sel.value;
    const options = ['<option value="">Cadastre ou selecione um veículo</option>']
        .concat((state.veiculos || []).map(v => {
            const label = [v.prefixo, v.placa, v.modelo].filter(Boolean).join(' — ');
            return `<option value="${escapeHtml(String(v.id))}">${escapeHtml(label || v.placa || v.id)}</option>`;
        }));
    sel.innerHTML = options.join('');
    if (current && state.veiculos.some(v => String(v.id) === String(current))) {
        sel.value = current;
    }
}

function getTireAtSlot(veiculoId, slotKey) {
    return (state.pneus || []).find(p =>
        String(p.veiculoId) === String(veiculoId) && String(p.posicao || p.slot || '') === String(slotKey)
    );
}

function sulcoClass(sulco) {
    const n = Number(sulco);
    if (isNaN(n)) return 'is-empty';
    if (n < 1.6) return 'is-critical';
    if (n <= 3) return 'is-alert';
    return 'is-good';
}

function renderVehicleMap() {
    const container = document.getElementById('vehicle-map');
    const sel = document.getElementById('mapa-veiculo-select');
    if (!container) return;

    const id = sel ? sel.value : '';
    if (!id) {
        container.innerHTML = '<div class="text-center py-12 text-slate-400"><i class="fa-solid fa-truck-fast text-3xl mb-3"></i><p>Selecione um veículo para visualizar o mapa.</p></div>';
        return;
    }

    const v = state.veiculos.find(item => String(item.id) === String(id));
    if (!v) {
        container.innerHTML = '<div class="text-center py-12 text-slate-400">Veículo não encontrado.</div>';
        return;
    }

    const eixos = Array.isArray(v.eixos) ? v.eixos : [];
    let html = `
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
                <h4 class="font-bold text-slate-800">${escapeHtml(v.placa || '')} ${v.prefixo ? '(' + escapeHtml(v.prefixo) + ')' : ''}</h4>
                <p class="text-xs text-slate-500">${escapeHtml(v.modelo || '')} · ${escapeHtml(v.categoria || '')}</p>
            </div>
            <span class="text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">${countMountedTires(eixos)} montados + ${Number(v.estepe) || 0} estepe(s)</span>
        </div>
    `;

    if (!eixos.length) {
        html += '<p class="text-sm text-slate-400">Este veículo não tem eixos configurados. Edite o cadastro.</p>';
        container.innerHTML = html;
        return;
    }

    eixos.forEach((eixo, eixoIdx) => {
        const leftSlots = [];
        const rightSlots = [];
        for (let i = 1; i <= (Number(eixo.esq) || 0); i++) {
            leftSlots.push(`L${eixoIdx + 1}-${i}`);
        }
        for (let i = 1; i <= (Number(eixo.dir) || 0); i++) {
            rightSlots.push(`R${eixoIdx + 1}-${i}`);
        }

        const renderSlot = (slotKey) => {
            const tire = getTireAtSlot(v.id, slotKey);
            if (!tire) {
                return `<button type="button" class="map-wheel is-empty" onclick="openAssignTireModal('${escapeHtml(String(v.id))}','${escapeHtml(slotKey)}')">
                    <span class="wheel-icon"><i class="fa-regular fa-circle"></i></span>
                    <span class="text-[10px] font-semibold">${escapeHtml(slotKey)}</span>
                    <span class="block text-[10px] text-slate-400">Livre</span>
                </button>`;
            }
            const sulco = tire.sulcoAtual != null ? tire.sulcoAtual : tire.sulco;
            const cls = sulcoClass(sulco);
            return `<button type="button" class="map-wheel ${cls}" onclick="openAssignTireModal('${escapeHtml(String(v.id))}','${escapeHtml(slotKey)}')">
                <span class="wheel-icon"><i class="fa-solid fa-circle-dot"></i></span>
                <span class="text-[10px] font-bold">${escapeHtml(tire.fogo || tire.numero || slotKey)}</span>
                <span class="block text-[10px]">${sulco != null ? sulco + ' mm' : '-'}</span>
            </button>`;
        };

        html += `
            <div class="map-axle-row mb-3">
                <div class="map-axle-side">${leftSlots.map(renderSlot).join('')}</div>
                <div class="map-chassis">
                    <span class="text-[10px] uppercase tracking-wide text-slate-400">Eixo</span>
                    <strong class="text-sm">${escapeHtml(eixo.nome || ('Eixo ' + (eixoIdx + 1)))}</strong>
                </div>
                <div class="map-axle-side">${rightSlots.map(renderSlot).join('')}</div>
            </div>
        `;
    });

    const spareCount = Number(v.estepe) || 0;
    if (spareCount > 0) {
        html += '<div class="mt-4 border-t border-slate-100 pt-3"><p class="text-xs font-semibold text-slate-600 mb-2">Estepes</p><div class="flex flex-wrap gap-2">';
        for (let s = 1; s <= spareCount; s++) {
            html += renderSlotFn(v.id, 'EST-' + s);
        }
        html += '</div></div>';
    }

    container.innerHTML = html;

    function renderSlotFn(veiculoId, slotKey) {
        const tire = getTireAtSlot(veiculoId, slotKey);
        if (!tire) {
            return `<button type="button" class="map-wheel is-empty" onclick="openAssignTireModal('${escapeHtml(String(veiculoId))}','${escapeHtml(slotKey)}')">
                <span class="wheel-icon"><i class="fa-regular fa-circle"></i></span>
                <span class="text-[10px] font-semibold">${escapeHtml(slotKey)}</span>
                <span class="block text-[10px] text-slate-400">Livre</span>
            </button>`;
        }
        const sulco = tire.sulcoAtual != null ? tire.sulcoAtual : tire.sulco;
        return `<button type="button" class="map-wheel ${sulcoClass(sulco)}" onclick="openAssignTireModal('${escapeHtml(String(veiculoId))}','${escapeHtml(slotKey)}')">
            <span class="wheel-icon"><i class="fa-solid fa-circle-dot"></i></span>
            <span class="text-[10px] font-bold">${escapeHtml(tire.fogo || tire.numero || slotKey)}</span>
            <span class="block text-[10px]">${sulco != null ? sulco + ' mm' : '-'}</span>
        </button>`;
    }
}

function openAssignTireModal(veiculoId, slotKey) {
    const v = state.veiculos.find(item => String(item.id) === String(veiculoId));
    if (!v) return;

    document.getElementById('alocar-veiculo-id').value = veiculoId;
    document.getElementById('alocar-slot-key').value = slotKey;
    const label = document.getElementById('alocar-posicao-label');
    if (label) label.textContent = (v.placa || '') + ' · posição ' + slotKey;

    const select = document.getElementById('alocar-pneu-select');
    if (!select) return;

    const current = getTireAtSlot(veiculoId, slotKey);
    const disponiveis = (state.pneus || []).filter(p => {
        if (current && String(p.id) === String(current.id)) return true;
        const livre = !p.veiculoId || p.veiculo === 'Estoque' || p.status === 'Estoque' || p.status === 'Stock';
        return livre || String(p.veiculoId) === String(veiculoId);
    });

    select.innerHTML = '<option value="">Deixar posição vazia</option>' + disponiveis.map(p => {
        const txt = [p.fogo || p.numero, p.marca, p.medida].filter(Boolean).join(' · ');
        const selected = current && String(current.id) === String(p.id) ? ' selected' : '';
        return `<option value="${escapeHtml(String(p.id))}"${selected}>${escapeHtml(txt || p.id)}</option>`;
    }).join('');

    openModal('modal-alocar-pneu');
}

function handleAssignTire(event) {
    event.preventDefault();
    const veiculoId = document.getElementById('alocar-veiculo-id').value;
    const slotKey = document.getElementById('alocar-slot-key').value;
    const pneuId = document.getElementById('alocar-pneu-select').value;
    const v = state.veiculos.find(item => String(item.id) === String(veiculoId));
    if (!v) return;

    // Remove quem estava neste slot
    state.pneus = (state.pneus || []).map(p => {
        if (String(p.veiculoId) === String(veiculoId) && String(p.posicao || p.slot || '') === String(slotKey)) {
            return {
                ...p,
                veiculoId: null,
                veiculo: 'Estoque',
                posicao: null,
                slot: null,
                status: 'Estoque'
            };
        }
        return p;
    });

    if (pneuId) {
        state.pneus = state.pneus.map(p => {
            if (String(p.id) !== String(pneuId)) return p;
            // Se estava em outro slot, libera
            return {
                ...p,
                veiculoId: veiculoId,
                veiculo: v.placa || v.modelo || veiculoId,
                posicao: slotKey,
                slot: slotKey,
                status: 'Em Uso'
            };
        });
    }

    saveState();
    closeModal('modal-alocar-pneu');
    refreshVehicleUI();
    if (typeof renderTireList === 'function') renderTireList();
}

// Alias usado em alguns pontos antigos
function renderVehicleList() {
    if (typeof renderVeiculos === 'function') renderVeiculos();
}

function loadVeiculosFromSupabase() {
    // Dados vêm do JSON em lk_pneus_state (loadCloudStateForUser).
    refreshVehicleUI();
}

// Ao carregar o script, prepara preset padrão do modal
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('vehicle-axle-editor')) applyVehiclePreset();
        populateMapaVeiculoSelect();
    });
} else {
    if (document.getElementById('vehicle-axle-editor')) applyVehiclePreset();
    populateMapaVeiculoSelect();
}
