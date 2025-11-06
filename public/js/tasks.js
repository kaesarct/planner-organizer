import { db, currentUser } from './config.js';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function renderTasks() {
    const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('visible', '==', true)));
    const tasks = tasksSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const pending = tasks.filter(t => t.status === 'pending');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const completed = tasks.filter(t => t.status === 'completed');
    const cancelled = tasks.filter(t => t.status === 'cancelled');
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersMap = {};
    usersSnap.docs.forEach(u => usersMap[u.id] = u.data().name);
    
    const renderTaskCard = (task) => `
        <div class="card mb-2 task-card" onclick="editTask('${task.id}')" style="cursor:pointer">
            <div class="card-body p-3">
                <h6 class="card-title">${task.title}</h6>
                ${task.description ? `<p class="card-text small text-muted">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</p>` : ''}
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'secondary'}">${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}</span>
                    ${task.assigned_to ? `<small class="text-muted">${usersMap[task.assigned_to] || 'Utente'}</small>` : ''}
                </div>
                ${task.due_date ? `<small class="text-muted">📅 ${new Date(task.due_date).toLocaleDateString('it-IT')}</small>` : ''}
            </div>
        </div>
    `;
    
    return `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h4">✅ Task Board</h2>
            <button class="btn btn-success btn-sm" onclick="showTaskModal()">+ Task</button>
        </div>
        <div class="d-block d-lg-none">
            <div class="accordion" id="taskAccordion">
                <div class="accordion-item">
                    <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#pending">📋 Da Fare <span class="badge bg-secondary ms-2">${pending.length}</span></button></h2>
                    <div id="pending" class="accordion-collapse collapse show" data-bs-parent="#taskAccordion"><div class="accordion-body p-2">${pending.map(renderTaskCard).join('') || '<p class="text-muted small">Nessun task</p>'}</div></div>
                </div>
                <div class="accordion-item">
                    <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#inProgress">⚙️ In Corso <span class="badge bg-primary ms-2">${inProgress.length}</span></button></h2>
                    <div id="inProgress" class="accordion-collapse collapse" data-bs-parent="#taskAccordion"><div class="accordion-body p-2">${inProgress.map(renderTaskCard).join('') || '<p class="text-muted small">Nessun task</p>'}</div></div>
                </div>
                <div class="accordion-item">
                    <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#completed">✅ Completati <span class="badge bg-success ms-2">${completed.length}</span></button></h2>
                    <div id="completed" class="accordion-collapse collapse" data-bs-parent="#taskAccordion"><div class="accordion-body p-2">${completed.map(renderTaskCard).join('') || '<p class="text-muted small">Nessun task</p>'}</div></div>
                </div>
                <div class="accordion-item">
                    <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cancelled">❌ Annullati <span class="badge bg-danger ms-2">${cancelled.length}</span></button></h2>
                    <div id="cancelled" class="accordion-collapse collapse" data-bs-parent="#taskAccordion"><div class="accordion-body p-2">${cancelled.map(renderTaskCard).join('') || '<p class="text-muted small">Nessun task</p>'}</div></div>
                </div>
            </div>
        </div>
        <div class="row g-2 d-none d-lg-flex">
            <div class="col-lg-3">
                <div class="card">
                    <div class="card-header bg-secondary text-white py-2"><h6 class="mb-0">📋 Da Fare</h6><small>${pending.length} task</small></div>
                    <div class="card-body p-2" style="max-height: 70vh; overflow-y: auto">${pending.map(renderTaskCard).join('') || '<p class="text-muted small">Nessun task</p>'}</div>
                </div>
            </div>
            <div class="col-lg-3">
                <div class="card">
                    <div class="card-header bg-primary text-white py-2"><h6 class="mb-0">⚙️ In Corso</h6><small>${inProgress.length} task</small></div>
                    <div class="card-body p-2" style="max-height: 70vh; overflow-y: auto">${inProgress.map(renderTaskCard).join('') || '<p class="text-muted small">Nessun task</p>'}</div>
                </div>
            </div>
            <div class="col-lg-3">
                <div class="card">
                    <div class="card-header bg-success text-white py-2"><h6 class="mb-0">✅ Completati</h6><small>${completed.length} task</small></div>
                    <div class="card-body p-2" style="max-height: 70vh; overflow-y: auto">${completed.map(renderTaskCard).join('') || '<p class="text-muted small">Nessun task</p>'}</div>
                </div>
            </div>
            <div class="col-lg-3">
                <div class="card">
                    <div class="card-header bg-danger text-white py-2"><h6 class="mb-0">❌ Annullati</h6><small>${cancelled.length} task</small></div>
                    <div class="card-body p-2" style="max-height: 70vh; overflow-y: auto">${cancelled.map(renderTaskCard).join('') || '<p class="text-muted small">Nessun task</p>'}</div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="taskModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 id="taskModalTitle">Nuovo Task</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="task-id">
                        <div class="mb-3"><label class="form-label">Titolo</label><input type="text" id="task-title" class="form-control" required></div>
                        <div class="mb-3"><label class="form-label">Descrizione</label><textarea id="task-description" class="form-control" rows="3"></textarea></div>
                        <div class="mb-3"><label class="form-label">Stato</label><select id="task-status" class="form-select"><option value="pending">Da Fare</option><option value="in_progress">In Corso</option><option value="completed">Completato</option><option value="cancelled">Annullato</option></select></div>
                        <div class="mb-3"><label class="form-label">Priorità</label><select id="task-priority" class="form-select"><option value="low">Bassa</option><option value="medium">Media</option><option value="high">Alta</option></select></div>
                        <div class="mb-3"><label class="form-label">Data di Scadenza</label><input type="date" id="task-due-date" class="form-control"></div>
                        <div class="mb-3"><label class="form-label">Assegnato a</label><select id="task-assigned" class="form-select"><option value="">Nessuno</option></select></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        <button type="button" class="btn btn-danger" id="deleteTaskBtn" onclick="deleteTaskConfirm()" style="display:none">Elimina</button>
                        <button type="button" class="btn btn-primary" onclick="saveTask()">Salva</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.showTaskModal = async () => {
    document.getElementById('task-id').value = '';
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-status').value = 'pending';
    document.getElementById('task-priority').value = 'medium';
    document.getElementById('task-due-date').value = '';
    document.getElementById('task-assigned').value = '';
    document.getElementById('taskModalTitle').textContent = 'Nuovo Task';
    document.getElementById('deleteTaskBtn').style.display = 'none';
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersSelect = document.getElementById('task-assigned');
    usersSelect.innerHTML = '<option value="">Nessuno</option>';
    usersSnap.docs.forEach(u => {
        const data = u.data();
        usersSelect.innerHTML += `<option value="${u.id}">${data.name}</option>`;
    });
    new bootstrap.Modal(document.getElementById('taskModal')).show();
};

window.editTask = async (taskId) => {
    const taskSnap = await getDocs(collection(db, 'tasks'));
    const task = taskSnap.docs.find(d => d.id === taskId);
    if (!task) return;
    const data = task.data();
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = data.title;
    document.getElementById('task-description').value = data.description || '';
    document.getElementById('task-status').value = data.status;
    document.getElementById('task-priority').value = data.priority;
    document.getElementById('task-due-date').value = data.due_date || '';
    document.getElementById('task-assigned').value = data.assigned_to || '';
    document.getElementById('taskModalTitle').textContent = 'Modifica Task';
    document.getElementById('deleteTaskBtn').style.display = 'block';
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersSelect = document.getElementById('task-assigned');
    usersSelect.innerHTML = '<option value="">Nessuno</option>';
    usersSnap.docs.forEach(u => {
        const uData = u.data();
        usersSelect.innerHTML += `<option value="${u.id}">${uData.name}</option>`;
    });
    document.getElementById('task-assigned').value = data.assigned_to || '';
    new bootstrap.Modal(document.getElementById('taskModal')).show();
};

window.saveTask = async () => {
    const taskId = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        due_date: document.getElementById('task-due-date').value || null,
        assigned_to: document.getElementById('task-assigned').value || null
    };
    if (taskId) {
        await updateDoc(doc(db, 'tasks', taskId), taskData);
    } else {
        await addDoc(collection(db, 'tasks'), { ...taskData, created_by: currentUser.uid, visible: true, created_at: serverTimestamp() });
    }
    bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
    showPage('tasks');
};

window.deleteTaskConfirm = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo task?')) return;
    const taskId = document.getElementById('task-id').value;
    await updateDoc(doc(db, 'tasks', taskId), { visible: false });
    bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
    showPage('tasks');
};
