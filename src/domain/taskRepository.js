// src/domain/taskRepository.js
// Stockage en mémoire — volontairement simple pour ce mini-projet (voir QA_REPORT.md).

let tasks = [];
let nextId = 1;

export function resetTasks() {
  tasks = [];
  nextId = 1;
}

export function addTask(task) {
  const stored = { id: nextId++, status: 'à faire', ...task };
  tasks.push(stored);
  return stored;
}

export function getAllTasks() {
  return tasks;
}

export function getTaskById(id) {
  return tasks.find((t) => t.id === Number(id));
}

export function replaceTask(id, updatedTask) {
  const index = tasks.findIndex((t) => t.id === Number(id));
  if (index === -1) return null;
  tasks[index] = updatedTask;
  return updatedTask;
}
