import './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderEvents, renderCalendar } from './events.js';
import { renderTasks } from './tasks.js';
import { renderAdmin } from './admin.js';
import { initAuth } from './auth.js';

initAuth(() => showPage('dashboard'));

window.showPage = async (page) => {
    const content = document.getElementById('page-content');
    if (page === 'dashboard') content.innerHTML = await renderDashboard();
    else if (page === 'events') { content.innerHTML = await renderEvents(); setTimeout(renderCalendar, 100); }
    else if (page === 'tasks') content.innerHTML = await renderTasks();
    else if (page === 'admin') content.innerHTML = await renderAdmin();
};
