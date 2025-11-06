import { db, currentUser } from './config.js';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, getDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function renderDashboard() {
    const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('assigned_to', '==', currentUser.uid), where('visible', '==', true)));
    const tasks = tasksSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('start_date')));
    const events = eventsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('meeting_date', 'desc')));
    const reports = reportsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userRole = userDoc.data()?.role || 'base';
    const canAddReport = ['admin', 'reviewer', 'segretario'].includes(userRole);
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.start_date) >= now).slice(0, 5);
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    return `
        <h2>📊 Dashboard</h2>
        <div class="row mb-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">📝 Resoconti Riunioni</h5>
                        ${canAddReport ? '<button class="btn btn-sm btn-success" onclick="showAddReportModal()">+ Aggiungi Resoconto</button>' : ''}
                    </div>
                    <div class="card-body">
                        ${reports.length > 0 ? reports.slice(0, 5).map(r => `
                            <div class="border-bottom pb-2 mb-2">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <strong>${new Date(r.meeting_date).toLocaleDateString('it-IT', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'})}</strong>
                                        <p class="text-muted mb-1">${r.content.substring(0, 150)}${r.content.length > 150 ? '...' : ''}</p>
                                    </div>
                                    <button class="btn btn-sm btn-outline-primary ms-2" onclick="showReportModal('${r.id}', '${r.meeting_date}', \`${r.content.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">Leggi</button>
                                </div>
                            </div>
                        `).join('') : '<p class="text-muted">Nessun resoconto disponibile</p>'}
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-6 col-md-3 mb-3"><div class="card text-white bg-primary"><div class="card-body text-center"><h6>I Miei Task</h6><h2>${tasks.length}</h2></div></div></div>
            <div class="col-6 col-md-3 mb-3"><div class="card text-white bg-warning"><div class="card-body text-center"><h6>In Corso</h6><h2>${inProgress}</h2></div></div></div>
            <div class="col-6 col-md-3 mb-3"><div class="card text-white bg-secondary"><div class="card-body text-center"><h6>Da Fare</h6><h2>${pending}</h2></div></div></div>
            <div class="col-6 col-md-3 mb-3"><div class="card text-white bg-success"><div class="card-body text-center"><h6>Completati</h6><h2>${completed}</h2></div></div></div>
        </div>
        <div class="row mt-2">
            <div class="col-12 col-md-6 mb-3">
                <div class="card">
                    <div class="card-header"><h5>Prossimi Eventi</h5></div>
                    <div class="card-body">
                        ${upcomingEvents.length > 0 ? upcomingEvents.map(event => `
                            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border-start border-3 border-success">
                                <div><strong>${event.title}</strong><br><small class="text-muted">${formatDashboardDate(event.start_date)}</small></div>
                                <span class="badge bg-primary">${event.type}</span>
                            </div>
                        `).join('') : '<p class="text-muted">Nessun evento in programma</p>'}
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-6 mb-3">
                <div class="card">
                    <div class="card-header"><h5>I Miei Task</h5></div>
                    <div class="card-body">
                        ${tasks.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead><tr><th>Titolo</th><th>Priorità</th><th>Stato</th><th>Scadenza</th></tr></thead>
                                    <tbody>
                                        ${tasks.slice(0, 10).map(task => `
                                            <tr>
                                                <td><strong>${task.title}</strong></td>
                                                <td><span class="badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'secondary'}">${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}</span></td>
                                                <td><span class="badge bg-${task.status === 'in_progress' ? 'primary' : task.status === 'pending' ? 'secondary' : task.status === 'completed' ? 'success' : 'danger'}">${task.status === 'in_progress' ? 'In Corso' : task.status === 'pending' ? 'Da Fare' : task.status === 'completed' ? 'Completato' : 'Annullato'}</span></td>
                                                <td>${task.due_date ? `<small>${new Date(task.due_date).toLocaleDateString('it-IT')}</small>` : '<small>-</small>'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p class="text-muted">Nessun task assegnato</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function formatDashboardDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Domani';
    if (diffDays < 7) return `Tra ${diffDays} giorni`;
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.showReportModal = (id, date, content) => {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Resoconto del ${new Date(date).toLocaleDateString('it-IT', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'})}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="white-space: pre-wrap;">${content}</div>
                <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
};

window.showAddReportModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Aggiungi Resoconto Riunione</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Data Riunione</label>
                        <input type="date" id="report-date" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Resoconto</label>
                        <textarea id="report-content" class="form-control" rows="10" required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="button" class="btn btn-success" onclick="saveReport()">Salva</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
};

window.saveReport = async () => {
    const date = document.getElementById('report-date').value;
    const content = document.getElementById('report-content').value;
    if (!date || !content) return alert('Compila tutti i campi');
    await addDoc(collection(db, 'reports'), {
        meeting_date: date,
        content,
        created_by: currentUser.uid,
        created_at: serverTimestamp()
    });
    document.querySelector('.modal.show .btn-close').click();
    showPage('dashboard');
};
