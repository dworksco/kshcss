// State Management
let tasks = [
    { id: 1, title: "주간 보고서 작성", completed: false, priority: "high" },
    { id: 2, title: "팀 미팅 준비", completed: true, priority: "medium" },
    { id: 3, title: "이메일 답장", completed: false, priority: "low" },
    { id: 4, title: "신규 기능 기획안 검토", completed: false, priority: "high" }
];

// DOM Elements
const taskList = document.getElementById('task-list');
const btnAddTask = document.getElementById('btn-add-task');
const taskModal = document.getElementById('task-modal');
const closeModal = document.querySelector('.close-modal');
const cancelTask = document.getElementById('cancel-task');
const saveTask = document.getElementById('save-task');
const taskInput = document.getElementById('task-input');
const taskPriority = document.getElementById('task-priority');

// Stats Elements
const completedCountEl = document.getElementById('completed-count');
const ongoingCountEl = document.getElementById('ongoing-count');
const completionRateEl = document.getElementById('completion-rate');

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    updateStats();
});

// Functions
function renderTasks() {
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.innerHTML = `
            <div class="task-checkbox" onclick="toggleTask(${task.id})">
                ${task.completed ? '<i class="fas fa-check" style="color: white; font-size: 12px; display: block; text-align: center; line-height: 20px;"></i>' : ''}
            </div>
            <div class="task-info">
                <span class="task-title">${task.title}</span>
                <span class="priority-tag ${task.priority}">${getPriorityLabel(task.priority)}</span>
            </div>
            <button class="btn-icon" onclick="deleteTask(${task.id})">
                <i class="far fa-trash-alt"></i>
            </button>
        `;
        taskList.appendChild(taskItem);
    });
}

function getPriorityLabel(priority) {
    switch(priority) {
        case 'high': return '높음';
        case 'medium': return '보통';
        case 'low': return '낮음';
        default: return '보통';
    }
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const ongoing = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    completedCountEl.textContent = completed;
    ongoingCountEl.textContent = ongoing;
    completionRateEl.textContent = `${rate}%`;
}

window.toggleTask = function(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    renderTasks();
    updateStats();
};

window.deleteTask = function(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
        tasks = tasks.filter(task => task.id !== id);
        renderTasks();
        updateStats();
    }
};

// Modal Events
btnAddTask.addEventListener('click', () => {
    taskModal.classList.add('active');
    taskInput.focus();
});

const hideModal = () => {
    taskModal.classList.remove('active');
    taskInput.value = '';
    taskPriority.value = 'low';
};

closeModal.addEventListener('click', hideModal);
cancelTask.addEventListener('click', hideModal);

saveTask.addEventListener('click', () => {
    const title = taskInput.value.trim();
    if (title) {
        const newTask = {
            id: Date.now(),
            title: title,
            completed: false,
            priority: taskPriority.value
        };
        tasks.unshift(newTask);
        renderTasks();
        updateStats();
        hideModal();
    } else {
        alert('작업 내용을 입력해주세요.');
    }
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === taskModal) hideModal();
});
