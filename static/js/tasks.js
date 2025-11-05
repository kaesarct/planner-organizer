const taskData = {};
let isEditMode = false;

function setTaskData(data) {
    Object.assign(taskData, data);
}

function openTaskModal(id = null) {
    isEditMode = id !== null;
    
    if (isEditMode) {
        const task = taskData[id];
        if (!task) return;
        
        document.getElementById('modalTitle').value = task.title;
        document.getElementById('modalDescription').value = task.description;
        document.getElementById('modalStatus').value = task.status;
        document.getElementById('modalPriority').value = task.priority;
        document.getElementById('modalDueDate').value = task.due_date || '';
        document.getElementById('modalAssigned').value = task.assigned_to_id;
        

        document.getElementById('taskTitle').textContent = 'Modifica Task';
        document.getElementById('taskForm').action = `/task/${id}/update`;
        document.getElementById('saveBtn').textContent = 'Salva';
        document.getElementById('saveBtn').className = 'btn btn-primary';
        
        const permissions = window.permissions || {};
        const canEdit = permissions.task_create_edit || false;
        
        document.getElementById('modalTitle').readOnly = !permissions.title;
        document.getElementById('modalDescription').readOnly = !permissions.description;
        document.getElementById('modalStatus').disabled = !permissions.status;
        document.getElementById('modalPriority').disabled = !permissions.priority;
        document.getElementById('modalDueDate').readOnly = !permissions.due_date;
        document.getElementById('modalAssigned').disabled = !permissions.assigned_to;
        document.getElementById('saveBtn').style.display = canEdit ? 'block' : 'none';
    } else {
        document.getElementById('modalTitle').value = '';
        document.getElementById('modalDescription').value = '';
        document.getElementById('modalStatus').value = 'pending';
        document.getElementById('modalPriority').value = 'medium';
        document.getElementById('modalDueDate').value = '';
        document.getElementById('modalAssigned').value = '';
        document.getElementById('taskTitle').textContent = 'Crea Task';
        document.getElementById('taskForm').action = '/task/create';
        document.getElementById('saveBtn').textContent = 'Crea Task';
        document.getElementById('saveBtn').className = 'btn btn-success';
        
        document.getElementById('modalTitle').readOnly = false;
        document.getElementById('modalDescription').readOnly = false;
        document.getElementById('modalStatus').disabled = false;
        document.getElementById('modalPriority').disabled = false;
        document.getElementById('modalDueDate').readOnly = false;
        document.getElementById('modalAssigned').disabled = false;
        document.getElementById('saveBtn').style.display = 'block';
    }
}

function loadTask(id) {
    openTaskModal(id);
}

function createTask() {
    openTaskModal();
}

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});