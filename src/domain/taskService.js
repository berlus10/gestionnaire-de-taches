// src/domain/taskService.js
// Couche logique métier — indépendante de l'API et du stockage.

const ALLOWED_PRIORITIES = ['basse', 'moyenne', 'haute'];
const DEFAULT_PRIORITY = 'moyenne';

export function createTask({ title, priority }) {
  if (!title || title.trim() === '') {
    throw new Error('Le titre est obligatoire');
  }

  const finalPriority = priority ?? DEFAULT_PRIORITY;

  if (!ALLOWED_PRIORITIES.includes(finalPriority)) {
    throw new Error('Priorité invalide');
  }

  return {
    title: title.trim(),
    priority: finalPriority,
  };
}

function normalizeToMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isOverdue(task, referenceDate = new Date()) {
  if (!task.dueDate) {
    throw new Error('Date d\'échéance manquante');
  }

  if (task.status === 'terminée') {
    return false;
  }

  const due = normalizeToMidnight(task.dueDate);
  const today = normalizeToMidnight(referenceDate);

  return due < today;
}

const ALLOWED_STATUSES = ['à faire', 'en cours', 'terminée'];

export function updateTaskStatus(task, newStatus) {
  if (!ALLOWED_STATUSES.includes(newStatus)) {
    throw new Error('Statut invalide');
  }

  if (task.status === 'terminée' && newStatus === 'à faire') {
    throw new Error('Transition de statut interdite : une tâche terminée doit repasser par "en cours"');
  }

  return {
    ...task,
    status: newStatus,
  };
}

function isUrgent(task, referenceDate) {
  return isOverdue(task, referenceDate) && task.priority === 'haute';
}

export function sortTasksByUrgency(tasks, referenceDate = new Date()) {
  return [...tasks].sort((a, b) => {
    const aUrgent = isUrgent(a, referenceDate) ? 0 : 1;
    const bUrgent = isUrgent(b, referenceDate) ? 0 : 1;
    return aUrgent - bUrgent;
  });
}

export function countOverdueTasks(tasks, referenceDate = new Date()) {
  return tasks.filter((task) => isOverdue(task, referenceDate)).length;
}
