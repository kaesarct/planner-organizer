import './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderEvents, renderCalendar } from './events.js';
import { renderTasks } from './tasks.js';
import { renderPolls } from './polls.v2.js';
import { renderAdmin } from './admin.js';
import { initAuth } from './auth.js';

initAuth(() => showPage('dashboard'));

window.showPage = async (page) => {
    try {
        console.log('showPage called with:', page);
        
        // Chiudi il menu mobile se aperto
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) {
                bsCollapse.hide();
            } else {
                navbarCollapse.classList.remove('show');
            }
        }
        
        const content = document.getElementById('page-content');
        if (page === 'dashboard') content.innerHTML = await renderDashboard();
        else if (page === 'events') { content.innerHTML = await renderEvents(); setTimeout(renderCalendar, 100); }
        else if (page === 'tasks') content.innerHTML = await renderTasks();
        else if (page === 'polls') {
            console.log('Rendering polls page...');
            content.innerHTML = await renderPolls();
            console.log('Polls page rendered successfully');
        }
        else if (page === 'admin') content.innerHTML = await renderAdmin();
    } catch (error) {
        console.error('Error in showPage:', error);
        alert('Errore nel caricamento della pagina: ' + error.message);
    }
};
