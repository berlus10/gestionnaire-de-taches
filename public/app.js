const form = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const errorMessage = document.getElementById('error-message');
const overdueCountEl = document.getElementById('overdue-count');

async function fetchTasks() {
  const response = await fetch('/api/tasks');
  const tasks = await response.json();
  renderTasks(tasks);
}

async function fetchOverdueCount() {
  const response = await fetch('/api/tasks/overdue-count');
  const data = await response.json();
  overdueCountEl.textContent = data.count;
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `priority-${task.priority}`;
    li.setAttribute('data-testid', 'task-item');
    li.textContent = `${task.title} — ${task.priority} — ${task.status} (échéance : ${task.dueDate})`;
    taskList.appendChild(li);
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const title = document.getElementById('title').value;
  const priority = document.getElementById('priority').value;
  const dueDate = document.getElementById('dueDate').value;

  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority, dueDate }),
  });

  const data = await response.json();

  if (!response.ok) {
    showError(data.error);
    return;
  }

  form.reset();
  document.getElementById('priority').value = 'moyenne';
  await fetchTasks();
  await fetchOverdueCount();
});

fetchTasks();
fetchOverdueCount();
