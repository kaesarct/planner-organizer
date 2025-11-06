import { db } from './config.js';
import { collection, getDocs, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function renderAdmin() {
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    const tasks = tasksSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const eventsSnap = await getDocs(collection(db, 'events'));
    const events = eventsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const usersMap = {};
    users.forEach(u => usersMap[u.id] = u.name);
    
    setTimeout(() => {
        const tbody = document.getElementById('admin-tasks-tbody');
        if (tbody) {
            tbody.innerHTML = tasks.map(t => `
                <tr>
                    <td><strong>${t.title}</strong>${t.description ? `<br><small class="text-muted">${t.description}</small>` : ''}</td>
                    <td><span class="badge bg-${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'secondary'}">${t.priority}</span></td>
                    <td><span class="badge bg-${t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'primary' : 'secondary'}">${t.status}</span></td>
                    <td><small class="text-muted">${t.due_date ? new Date(t.due_date).toLocaleDateString('it-IT') : '-'}</small></td>
                    <td><small class="text-muted">${t.assigned_to ? (usersMap[t.assigned_to] || 'Utente') : 'Non assegnato'}</small></td>
                    <td><span class="badge bg-${t.visible ? 'success' : 'danger'}">${t.visible ? '👁️ Visibile' : '🙈 Nascosto'}</span></td>
                    <td><button class="btn btn-${t.visible ? 'secondary' : 'success'} btn-sm" onclick="toggleTaskVisibility('${t.id}', ${!t.visible})">${t.visible ? '🙈' : '👁️'}</button></td>
                </tr>
            `).join('');
        }
        loadPermissions();
    }, 100);
    
    return `
        <div class="d-flex justify-content-between align-items-center mb-4"><h2>🛠️ Pannello Admin</h2></div>
        <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#admin-users">👥 Utenti</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#admin-tasks">✅ Task</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#admin-events">📅 Eventi</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#admin-reports" onclick="setTimeout(loadReports, 100)">📝 Resoconti</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#admin-settings" onclick="setTimeout(loadPermissions, 100)">⚙️ Permessi</a></li>
        </ul>
        <div class="tab-content">
            <div class="tab-pane fade show active" id="admin-users">
                <h5>Gestione Utenti (${users.length})</h5>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead><tr><th>Nome</th><th>Email</th><th>Ruolo</th><th>Azioni</th></tr></thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>${u.name}</td>
                                    <td>${u.email}</td>
                                    <td><span class="badge bg-${u.role === 'admin' ? 'danger' : u.role === 'reviewer' ? 'warning' : u.role === 'segretario' ? 'info' : 'secondary'}">${u.role}</span></td>
                                    <td>
                                        <select class="form-select form-select-sm" style="width:auto; display:inline-block" onchange="changeUserRole('${u.id}', this.value)">
                                            <option value="base" ${u.role === 'base' ? 'selected' : ''}>Base</option>
                                            <option value="segretario" ${u.role === 'segretario' ? 'selected' : ''}>Segretario</option>
                                            <option value="reviewer" ${u.role === 'reviewer' ? 'selected' : ''}>Reviewer</option>
                                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                                        </select>
                                        <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">🗑️</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="tab-pane fade" id="admin-tasks">
                <h5>Gestione Task (${tasks.length})</h5>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead><tr><th>Titolo</th><th>Priorità</th><th>Stato</th><th>Scadenza</th><th>Assegnato a</th><th>Visibile</th><th>Azioni</th></tr></thead>
                        <tbody id="admin-tasks-tbody"></tbody>
                    </table>
                </div>
            </div>
            <div class="tab-pane fade" id="admin-events">
                <h5>Gestione Eventi (${events.length})</h5>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead><tr><th>Titolo</th><th>Tipo</th><th>Data Inizio</th><th>Luogo</th><th>Azioni</th></tr></thead>
                        <tbody>
                            ${events.map(e => `
                                <tr>
                                    <td><strong>${e.title}</strong></td>
                                    <td><span class="badge bg-primary">${e.type}</span></td>
                                    <td><small>${new Date(e.start_date).toLocaleDateString('it-IT')}</small></td>
                                    <td><small class="text-muted">${e.location || '-'}</small></td>
                                    <td><button class="btn btn-danger btn-sm" onclick="deleteEventAdmin('${e.id}')">🗑️</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="tab-pane fade" id="admin-reports">
                <h5>Gestione Resoconti</h5>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead><tr><th>Data Riunione</th><th>Anteprima</th><th>Azioni</th></tr></thead>
                        <tbody id="admin-reports-tbody"></tbody>
                    </table>
                </div>
            </div>
            <div class="tab-pane fade" id="admin-settings">
                <h5>Gestione Permessi per Ruolo</h5>
                <div class="card mb-3">
                    <div class="card-header"><strong>Permessi Generali Eventi</strong></div>
                    <div class="card-body">
                        <table class="table table-bordered table-sm">
                            <thead><tr><th>Azione</th><th class="text-center">Base</th><th class="text-center">Segretario</th><th class="text-center">Reviewer</th><th class="text-center">Admin</th></tr></thead>
                            <tbody id="event-general-permissions-tbody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="card mb-3">
                    <div class="card-header"><strong>Permessi Campi Eventi</strong></div>
                    <div class="card-body">
                        <table class="table table-bordered table-sm">
                            <thead><tr><th>Campo</th><th class="text-center">Base</th><th class="text-center">Segretario</th><th class="text-center">Reviewer</th><th class="text-center">Admin</th></tr></thead>
                            <tbody id="event-fields-permissions-tbody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="card mb-3">
                    <div class="card-header"><strong>Permessi Generali Task</strong></div>
                    <div class="card-body">
                        <table class="table table-bordered table-sm">
                            <thead><tr><th>Azione</th><th class="text-center">Base</th><th class="text-center">Segretario</th><th class="text-center">Reviewer</th><th class="text-center">Admin</th></tr></thead>
                            <tbody id="task-general-permissions-tbody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="card mb-3">
                    <div class="card-header"><strong>Permessi Campi Task</strong></div>
                    <div class="card-body">
                        <table class="table table-bordered table-sm">
                            <thead><tr><th>Campo</th><th class="text-center">Base</th><th class="text-center">Segretario</th><th class="text-center">Reviewer</th><th class="text-center">Admin</th></tr></thead>
                            <tbody id="task-fields-permissions-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.changeUserRole = async (userId, role) => {
    await updateDoc(doc(db, 'users', userId), { role });
    showPage('admin');
};

window.deleteUser = async (userId) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
    await deleteDoc(doc(db, 'users', userId));
    showPage('admin');
};

window.toggleTaskVisibility = async (taskId, visible) => {
    await updateDoc(doc(db, 'tasks', taskId), { visible });
    showPage('admin');
};

window.deleteEventAdmin = async (eventId) => {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;
    await deleteDoc(doc(db, 'events', eventId));
    showPage('admin');
};

window.loadPermissions = async function() {
    try {
        const permissions = { base: {}, segretario: {}, reviewer: {}, admin: {} };
        for (const role of ['base', 'segretario', 'reviewer', 'admin']) {
            const permDoc = await getDoc(doc(db, 'permissions', role));
            if (!permDoc.exists()) {
                const defaultPerms = {
                    event_create: role !== 'base', event_edit: role !== 'base', event_delete: role !== 'base',
                    event_field_title: role !== 'base', event_field_description: role !== 'base', event_field_type: role !== 'base',
                    event_field_location: role !== 'base', event_field_start_date: role !== 'base', event_field_end_date: role !== 'base',
                    task_create: role !== 'base', task_edit: true, task_delete: role !== 'base',
                    task_field_title: true, task_field_description: true, task_field_status: true,
                    task_field_priority: role !== 'base', task_field_due_date: role !== 'base', task_field_assigned: role !== 'base'
                };
                await setDoc(doc(db, 'permissions', role), defaultPerms);
                permissions[role] = defaultPerms;
            } else {
                permissions[role] = permDoc.data();
            }
        }
        const renderTable = (tbodyId, perms) => {
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;
            tbody.innerHTML = perms.map(perm => `
                <tr>
                    <td>${perm.label}</td>
                    <td class="text-center"><input type="checkbox" class="form-check-input" ${permissions.base[perm.key] ? 'checked' : ''} onchange="togglePermission('base', '${perm.key}', this.checked)"></td>
                    <td class="text-center"><input type="checkbox" class="form-check-input" ${permissions.reviewer[perm.key] ? 'checked' : ''} onchange="togglePermission('reviewer', '${perm.key}', this.checked)"></td>
                    <td class="text-center"><input type="checkbox" class="form-check-input" ${permissions.admin[perm.key] ? 'checked' : ''} disabled></td>
                </tr>
            `).join('');
        };
        const permissions_segretario = permissions.segretario || {};
        const renderTableWithSegretario = (tbodyId, perms) => {
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;
            tbody.innerHTML = perms.map(perm => `
                <tr>
                    <td>${perm.label}</td>
                    <td class="text-center"><input type="checkbox" class="form-check-input" ${permissions.base[perm.key] ? 'checked' : ''} onchange="togglePermission('base', '${perm.key}', this.checked)"></td>
                    <td class="text-center"><input type="checkbox" class="form-check-input" ${permissions_segretario[perm.key] ? 'checked' : ''} onchange="togglePermission('segretario', '${perm.key}', this.checked)"></td>
                    <td class="text-center"><input type="checkbox" class="form-check-input" ${permissions.reviewer[perm.key] ? 'checked' : ''} onchange="togglePermission('reviewer', '${perm.key}', this.checked)"></td>
                    <td class="text-center"><input type="checkbox" class="form-check-input" ${permissions.admin[perm.key] ? 'checked' : ''} disabled></td>
                </tr>
            `).join('');
        };
        renderTableWithSegretario('event-general-permissions-tbody', [
            { key: 'event_create', label: 'Crea Eventi' },
            { key: 'event_edit', label: 'Modifica Eventi' },
            { key: 'event_delete', label: 'Elimina Eventi' }
        ]);
        renderTableWithSegretario('event-fields-permissions-tbody', [
            { key: 'event_field_title', label: 'Titolo' },
            { key: 'event_field_description', label: 'Descrizione' },
            { key: 'event_field_type', label: 'Tipo' },
            { key: 'event_field_location', label: 'Luogo' },
            { key: 'event_field_start_date', label: 'Data Inizio' },
            { key: 'event_field_end_date', label: 'Data Fine' }
        ]);
        renderTableWithSegretario('task-general-permissions-tbody', [
            { key: 'task_create', label: 'Crea Task' },
            { key: 'task_edit', label: 'Modifica Task' },
            { key: 'task_delete', label: 'Elimina Task' }
        ]);
        renderTableWithSegretario('task-fields-permissions-tbody', [
            { key: 'task_field_title', label: 'Titolo' },
            { key: 'task_field_description', label: 'Descrizione' },
            { key: 'task_field_status', label: 'Stato' },
            { key: 'task_field_priority', label: 'Priorità' },
            { key: 'task_field_due_date', label: 'Data Scadenza' },
            { key: 'task_field_assigned', label: 'Assegnato a' }
        ]);
    } catch (error) {
        console.error('Errore caricamento permessi:', error);
    }
}

window.togglePermission = async (role, permission, value) => {
    await setDoc(doc(db, 'permissions', role), { [permission]: value }, { merge: true });
};

window.loadReports = async () => {
    const reportsSnap = await getDocs(collection(db, 'reports'));
    const reports = reportsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    reports.sort((a, b) => new Date(b.meeting_date) - new Date(a.meeting_date));
    const tbody = document.getElementById('admin-reports-tbody');
    if (tbody) {
        tbody.innerHTML = reports.map(r => `
            <tr>
                <td><strong>${new Date(r.meeting_date).toLocaleDateString('it-IT', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'})}</strong></td>
                <td><small class="text-muted">${r.content.substring(0, 100)}${r.content.length > 100 ? '...' : ''}</small></td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteReport('${r.id}')">🗑️</button></td>
            </tr>
        `).join('');
    }
};

window.deleteReport = async (reportId) => {
    if (!confirm('Sei sicuro di voler eliminare questo resoconto?')) return;
    await deleteDoc(doc(db, 'reports', reportId));
    loadReports();
};
