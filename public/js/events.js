import { db, currentUser } from './config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let calendarDate = new Date();
let allEvents = [];
let calendarView = 'month';
let currentEventId = null;

export async function renderEvents() {
    const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('start_date')));
    const events = eventsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const now = new Date();
    const futureEvents = events.filter(e => new Date(e.start_date) >= now);
    const pastEvents = events.filter(e => new Date(e.start_date) < now).reverse();
    
    return `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>📅 Eventi</h2>
            <button class="btn btn-success" onclick="showEventModal()">+ Nuovo Evento</button>
        </div>
        <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#list-view">📋 Lista</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#calendar-view" onclick="setTimeout(renderCalendar, 100)">📅 Calendario</a></li>
        </ul>
        <div class="tab-content">
            <div class="tab-pane fade show active" id="list-view">
                ${futureEvents.length > 0 ? `<h4 class="text-success mb-3">📅 Prossimi Eventi</h4><div class="row">${futureEvents.map(e => `
                    <div class="col-md-6 mb-3">
                        <div class="card border-success" style="cursor:pointer" onclick="showEventDetails('${e.id}')">
                            <div class="card-body">
                                <h5>${e.title}</h5>
                                <span class="badge bg-primary">${e.type}</span><br>
                                <small class="text-muted">${formatEventDate(e.start_date)} - ${formatEventDate(e.end_date)}</small>
                                ${e.location ? `<p class="mt-2 mb-0">📍 ${e.location}</p>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}</div>` : '<div class="alert alert-info">Nessun evento futuro</div>'}
                ${pastEvents.length > 0 ? `
                    <div class="card mt-4">
                        <div class="card-header" style="cursor:pointer" onclick="togglePastEvents()">
                            <h5 class="mb-0 text-muted">📁 Eventi Passati (${pastEvents.length}) <span id="past-icon" class="float-end">▼</span></h5>
                        </div>
                        <div id="past-events" class="collapse">
                            <div class="card-body"><div class="row">${pastEvents.map(e => `
                                <div class="col-md-6 mb-3">
                                    <div class="card bg-light" style="cursor:pointer" onclick="showEventDetails('${e.id}')">
                                        <div class="card-body">
                                            <h6 class="text-muted">${e.title}</h6>
                                            <span class="badge bg-secondary">${e.type}</span><br>
                                            <small>${formatEventDate(e.start_date)}</small>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}</div></div>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="tab-pane fade" id="calendar-view">
                <div class="card">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <button class="btn btn-outline-secondary btn-sm" onclick="changePeriod(-1)">‹</button>
                            <h6 id="calendar-title" class="mb-0 text-center flex-grow-1"></h6>
                            <button class="btn btn-outline-secondary btn-sm" onclick="changePeriod(1)">›</button>
                        </div>
                        <div class="btn-group w-100">
                            <button type="button" class="btn btn-outline-success btn-sm active" id="monthViewBtn" onclick="setCalendarView('month')">📅 Mese</button>
                            <button type="button" class="btn btn-outline-success btn-sm" id="weekViewBtn" onclick="setCalendarView('week')">📋 Settimana</button>
                        </div>
                    </div>
                    <div class="card-body p-2"><div id="calendar-grid"></div></div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="eventModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 id="eventModalTitle">Nuovo Evento</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="event-id">
                        <div class="mb-3"><label class="form-label">Titolo</label><input type="text" id="event-title" class="form-control" required></div>
                        <div class="mb-3"><label class="form-label">Descrizione</label><textarea id="event-description" class="form-control" rows="3"></textarea></div>
                        <div class="mb-3"><label class="form-label">Tipo</label><select id="event-type" class="form-select"><option value="riunione">Riunione</option><option value="uscita">Uscita</option><option value="campo">Campo</option><option value="consiglio">Consiglio</option></select></div>
                        <div class="mb-3"><label class="form-label">Luogo</label><input type="text" id="event-location" class="form-control" placeholder="Cerca luogo..." autocomplete="off"><div id="location-results" class="list-group" style="display:none; max-height:200px; overflow-y:auto;"></div><input type="hidden" id="event-location-lat"><input type="hidden" id="event-location-lng"></div>
                        <div class="mb-3"><label class="form-label">Data Inizio</label><input type="datetime-local" id="event-start" class="form-control" required></div>
                        <div class="mb-3"><label class="form-label">Data Fine</label><input type="datetime-local" id="event-end" class="form-control" required></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        <button type="button" class="btn btn-danger" id="deleteEventBtn" onclick="deleteEventConfirm()" style="display:none">Elimina</button>
                        <button type="button" class="btn btn-success" onclick="saveEvent()">Salva</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="eventDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header"><h5 id="detailsTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body" id="detailsBody"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        <button type="button" class="btn btn-primary" id="editEventBtn" onclick="editEventFromDetails()">✏️ Modifica</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.showEventModal = async () => {
    document.getElementById('event-id').value = '';
    document.getElementById('event-title').value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-type').value = 'riunione';
    document.getElementById('event-location').value = '';
    document.getElementById('event-location-lat').value = '';
    document.getElementById('event-location-lng').value = '';
    const now = new Date();
    const minDateTime = new Date(now.getTime() + 60 * 60 * 1000);
    const startInput = document.getElementById('event-start');
    const endInput = document.getElementById('event-end');
    startInput.min = minDateTime.toISOString().slice(0, 16);
    startInput.value = minDateTime.toISOString().slice(0, 16);
    const endTime = new Date(minDateTime.getTime() + 60 * 60 * 1000);
    endInput.min = endTime.toISOString().slice(0, 16);
    endInput.value = endTime.toISOString().slice(0, 16);
    document.getElementById('eventModalTitle').textContent = 'Nuovo Evento';
    document.getElementById('deleteEventBtn').style.display = 'none';
    startInput.onchange = function() {
        const startDate = new Date(this.value);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        endInput.value = endDate.toISOString().slice(0, 16);
        endInput.min = this.value;
    };
    setupLocationSearch();
    new bootstrap.Modal(document.getElementById('eventModal')).show();
};

window.saveEvent = async () => {
    const eventId = document.getElementById('event-id').value;
    const startDate = document.getElementById('event-start').value;
    const endDate = document.getElementById('event-end').value;
    if (!startDate || !endDate) { alert('Inserisci data inizio e fine!'); return; }
    const now = new Date();
    const minTime = new Date(now.getTime() + 60 * 60 * 1000);
    if (new Date(startDate) < minTime) { alert('La data di inizio deve essere almeno 1 ora dopo adesso!'); return; }
    if (new Date(endDate) <= new Date(startDate)) { alert('La data di fine deve essere successiva alla data di inizio!'); return; }
    const eventData = {
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-description').value,
        type: document.getElementById('event-type').value,
        location: document.getElementById('event-location').value || null,
        location_lat: parseFloat(document.getElementById('event-location-lat').value) || null,
        location_lng: parseFloat(document.getElementById('event-location-lng').value) || null,
        start_date: startDate,
        end_date: endDate
    };
    if (eventId) {
        await updateDoc(doc(db, 'events', eventId), eventData);
    } else {
        await addDoc(collection(db, 'events'), { ...eventData, created_by: currentUser.uid, created_at: serverTimestamp() });
    }
    bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
    showPage('events');
};

window.showEventDetails = async (eventId) => {
    const eventSnap = await getDocs(collection(db, 'events'));
    const event = eventSnap.docs.find(d => d.id === eventId);
    if (!event) return;
    const data = event.data();
    currentEventId = eventId;
    const isPast = new Date(data.start_date) < new Date();
    document.getElementById('detailsTitle').textContent = data.title;
    document.getElementById('detailsBody').innerHTML = `
        <p><strong>Tipo:</strong> <span class="badge bg-primary">${data.type}</span></p>
        <p><strong>Inizio:</strong> ${formatEventDate(data.start_date)}</p>
        <p><strong>Fine:</strong> ${formatEventDate(data.end_date)}</p>
        ${data.description ? `<p><strong>Descrizione:</strong> ${data.description}</p>` : ''}
        ${data.location ? `<p><strong>Luogo:</strong> ${data.location}</p>` : ''}
        <div class="mt-3"><strong>Aggiungi al calendario:</strong><br>
            <button class="btn btn-outline-primary btn-sm mt-2" onclick="addToGoogleCalendar('${eventId}')">📅 Google Calendar</button>
            <button class="btn btn-outline-secondary btn-sm mt-2" onclick="downloadICS('${eventId}')">📥 iCal/Outlook</button>
        </div>
        ${data.location_lat && data.location_lng ? `
            <div class="mt-3">
                <iframe width="100%" height="300" frameborder="0" style="border:0; border-radius:8px;" 
                    src="https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(data.location_lng)-0.01},${parseFloat(data.location_lat)-0.01},${parseFloat(data.location_lng)+0.01},${parseFloat(data.location_lat)+0.01}&layer=mapnik&marker=${data.location_lat},${data.location_lng}" 
                    allowfullscreen></iframe>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${data.location_lat},${data.location_lng}" target="_blank" class="btn btn-success btn-sm mt-2">📍 Indicazioni stradali</a>
            </div>
        ` : ''}
    `;
    document.getElementById('editEventBtn').style.display = isPast ? 'none' : 'block';
    new bootstrap.Modal(document.getElementById('eventDetailsModal')).show();
};

window.editEventFromDetails = async () => {
    bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal')).hide();
    const eventSnap = await getDocs(collection(db, 'events'));
    const event = eventSnap.docs.find(d => d.id === currentEventId);
    if (!event) return;
    const data = event.data();
    if (new Date(data.start_date) < new Date()) { alert('Non puoi modificare eventi passati!'); return; }
    document.getElementById('event-id').value = event.id;
    document.getElementById('event-title').value = data.title;
    document.getElementById('event-description').value = data.description || '';
    document.getElementById('event-type').value = data.type;
    document.getElementById('event-location').value = data.location || '';
    document.getElementById('event-location-lat').value = data.location_lat || '';
    document.getElementById('event-location-lng').value = data.location_lng || '';
    document.getElementById('event-start').value = data.start_date;
    document.getElementById('event-end').value = data.end_date;
    document.getElementById('eventModalTitle').textContent = 'Modifica Evento';
    document.getElementById('deleteEventBtn').style.display = 'block';
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const startInput = document.getElementById('event-start');
    const endInput = document.getElementById('event-end');
    startInput.min = now.toISOString().slice(0, 16);
    endInput.min = data.start_date;
    startInput.onchange = function() { endInput.min = this.value; };
    setupLocationSearch();
    new bootstrap.Modal(document.getElementById('eventModal')).show();
};

window.deleteEventConfirm = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;
    const eventId = document.getElementById('event-id').value;
    await deleteDoc(doc(db, 'events', eventId));
    bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
    showPage('events');
};

window.togglePastEvents = () => {
    const past = document.getElementById('past-events');
    const icon = document.getElementById('past-icon');
    if (past.classList.contains('show')) { past.classList.remove('show'); icon.textContent = '▼'; }
    else { past.classList.add('show'); icon.textContent = '▲'; }
};

window.formatEventDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

window.changePeriod = (direction) => {
    if (calendarView === 'month') calendarDate.setMonth(calendarDate.getMonth() + direction);
    else calendarDate.setDate(calendarDate.getDate() + (direction * 7));
    renderCalendar();
};

window.setCalendarView = (view) => {
    calendarView = view;
    document.getElementById('monthViewBtn').classList.toggle('active', view === 'month');
    document.getElementById('weekViewBtn').classList.toggle('active', view === 'week');
    renderCalendar();
};

export async function renderCalendar() {
    const eventsSnap = await getDocs(collection(db, 'events'));
    allEvents = eventsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    if (calendarView === 'month') renderMonthView();
    else renderWeekView();
}

function renderMonthView() {
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    document.getElementById('calendar-title').textContent = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    let html = '<div class="table-responsive"><table class="table table-bordered table-sm"><thead><tr>';
    ['D', 'L', 'M', 'M', 'G', 'V', 'S'].forEach(day => { html += `<th class="text-center p-1" style="font-size:0.8rem">${day}</th>`; });
    html += '</tr></thead><tbody>';
    let currentDate = new Date(startDate);
    for (let week = 0; week < 6; week++) {
        html += '<tr>';
        for (let day = 0; day < 7; day++) {
            const isCurrentMonth = currentDate.getMonth() === calendarDate.getMonth();
            const dayEvents = allEvents.filter(event => new Date(event.start_date).toDateString() === currentDate.toDateString());
            html += `<td class="${isCurrentMonth ? '' : 'text-muted'} p-1" style="min-height:60px; vertical-align:top; font-size:0.75rem;"><div class="fw-bold mb-1">${currentDate.getDate()}</div>`;
            dayEvents.forEach(event => {
                const color = event.type === 'riunione' ? 'primary' : event.type === 'uscita' ? 'success' : event.type === 'campo' ? 'warning' : 'danger';
                html += `<div class="badge bg-${color} w-100 mb-1" style="cursor:pointer; font-size:0.6rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" onclick="showEventDetails('${event.id}')" title="${event.title}">${event.title}</div>`;
            });
            html += '</td>';
            currentDate.setDate(currentDate.getDate() + 1);
        }
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    document.getElementById('calendar-grid').innerHTML = html;
}

function renderWeekView() {
    const weekStart = new Date(calendarDate);
    weekStart.setDate(calendarDate.getDate() - calendarDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    document.getElementById('calendar-title').textContent = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}/${weekEnd.getFullYear()}`;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        let html = '<div class="list-group">';
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dayEvents = allEvents.filter(event => new Date(event.start_date).toDateString() === date.toDateString());
            const dayName = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][i];
            html += `<div class="list-group-item"><h6 class="mb-2">${dayName} ${date.getDate()}/${date.getMonth()+1}</h6>`;
            if (dayEvents.length > 0) {
                dayEvents.forEach(event => {
                    const color = event.type === 'riunione' ? 'primary' : event.type === 'uscita' ? 'success' : event.type === 'campo' ? 'warning' : 'danger';
                    const time = new Date(event.start_date).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});
                    html += `<div class="card mb-2" style="cursor:pointer; border-left: 4px solid var(--bs-${color});" onclick="showEventDetails('${event.id}')"><div class="card-body p-2"><small class="text-muted">${time}</small><div class="fw-bold small">${event.title}</div></div></div>`;
                });
            } else {
                html += '<p class="text-muted small mb-0">Nessun evento</p>';
            }
            html += '</div>';
        }
        html += '</div>';
        document.getElementById('calendar-grid').innerHTML = html;
    } else {
        let html = '<table class="table table-bordered"><thead><tr>';
        ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'].forEach(day => { html += `<th class="text-center">${day}</th>`; });
        html += '</tr></thead><tbody><tr>';
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dayEvents = allEvents.filter(event => new Date(event.start_date).toDateString() === date.toDateString());
            html += `<td style="height:400px; vertical-align:top; width:14.28%;"><div class="fw-bold text-center mb-2">${date.getDate()}</div>`;
            dayEvents.forEach(event => {
                const color = event.type === 'riunione' ? 'primary' : event.type === 'uscita' ? 'success' : event.type === 'campo' ? 'warning' : 'danger';
                const time = new Date(event.start_date).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});
                html += `<div class="card mb-2" style="cursor:pointer; border-left: 4px solid var(--bs-${color});" onclick="showEventDetails('${event.id}')"><div class="card-body p-2"><small class="text-muted">${time}</small><div class="fw-bold small">${event.title}</div></div></div>`;
            });
            html += '</td>';
        }
        html += '</tr></tbody></table>';
        document.getElementById('calendar-grid').innerHTML = html;
    }
}

function setupLocationSearch() {
    const locationInput = document.getElementById('event-location');
    const resultsDiv = document.getElementById('location-results');
    let searchTimeout;
    locationInput.oninput = function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        if (query.length < 3) { resultsDiv.style.display = 'none'; return; }
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const results = await response.json();
                if (results.length > 0) {
                    resultsDiv.innerHTML = results.map(r => `<button type="button" class="list-group-item list-group-item-action" onclick="selectLocation('${r.display_name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${r.lat}, ${r.lon})">📍 ${r.display_name}</button>`).join('');
                    resultsDiv.style.display = 'block';
                } else {
                    resultsDiv.innerHTML = '<div class="list-group-item">Nessun risultato</div>';
                    resultsDiv.style.display = 'block';
                }
            } catch (error) { console.error('Errore ricerca luogo:', error); }
        }, 500);
    };
}

window.selectLocation = (name, lat, lng) => {
    document.getElementById('event-location').value = name;
    document.getElementById('event-location-lat').value = lat;
    document.getElementById('event-location-lng').value = lng;
    document.getElementById('location-results').style.display = 'none';
};

window.addToGoogleCalendar = async (eventId) => {
    const eventSnap = await getDocs(collection(db, 'events'));
    const event = eventSnap.docs.find(d => d.id === eventId);
    if (!event) return;
    const data = event.data();
    const startDate = new Date(data.start_date).toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(data.end_date).toISOString().replace(/-|:|\.\d+/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(data.description || '')}&location=${encodeURIComponent(data.location || '')}`;
    window.open(url, '_blank');
};

window.downloadICS = async (eventId) => {
    const eventSnap = await getDocs(collection(db, 'events'));
    const event = eventSnap.docs.find(d => d.id === eventId);
    if (!event) return;
    const data = event.data();
    const startDate = new Date(data.start_date).toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(data.end_date).toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Clan Planner//Event//IT', 'BEGIN:VEVENT', `UID:${eventId}@clanplanner`, `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}`, `DTSTART:${startDate}`, `DTEND:${endDate}`, `SUMMARY:${data.title}`, data.description ? `DESCRIPTION:${data.description.replace(/\n/g, '\\n')}` : '', data.location ? `LOCATION:${data.location}` : '', 'END:VEVENT', 'END:VCALENDAR'].filter(line => line).join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${data.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    link.click();
};
