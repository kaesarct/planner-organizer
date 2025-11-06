import { db, currentUser } from './config.js';
import { collection, getDocs, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function renderDashboard() {
    const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('assigned_to', '==', currentUser.uid), where('visible', '==', true)));
    const tasks = tasksSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('start_date')));
    const events = eventsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.start_date) >= now).slice(0, 5);
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    return `
        <h2>📊 Dashboard</h2>
        <div class="row">
            <div class="col-md-3"><div class="card text-white bg-primary"><div class="card-body"><h5>I Miei Task</h5><h2>${tasks.length}</h2></div></div></div>
            <div class="col-md-3"><div class="card text-white bg-warning"><div class="card-body"><h5>In Corso</h5><h2>${inProgress}</h2></div></div></div>
            <div class="col-md-3"><div class="card text-white bg-secondary"><div class="card-body"><h5>Da Fare</h5><h2>${pending}</h2></div></div></div>
            <div class="col-md-3"><div class="card text-white bg-success"><div class="card-body"><h5>Completati</h5><h2>${completed}</h2></div></div></div>
        </div>
        <div class="row mt-4">
            <div class="col-md-6">
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
            <div class="col-md-6">
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
