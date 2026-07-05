// src/routes/taskRoutes.js
import { Router } from 'express';
import {
  createTask,
  updateTaskStatus,
  sortTasksByUrgency,
  countOverdueTasks,
} from '../domain/taskService.js';
import {
  addTask,
  getAllTasks,
  getTaskById,
  replaceTask,
} from '../domain/taskRepository.js';

const router = Router();

// POST /tasks - créer une tâche
router.post('/tasks', (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;

    if (!dueDate) {
      return res.status(400).json({ error: 'La date d\'échéance est obligatoire' });
    }

    const task = createTask({ title, priority });
    const stored = addTask({ ...task, dueDate });
    res.status(201).json(stored);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /tasks - lister les tâches (triées par urgence)
router.get('/tasks', (req, res) => {
  const tasks = getAllTasks();
  const sorted = sortTasksByUrgency(tasks);
  res.status(200).json(sorted);
});

// PATCH /tasks/:id/status - changer le statut d'une tâche
router.patch('/tasks/:id/status', (req, res) => {
  const task = getTaskById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Tâche introuvable' });
  }

  try {
    const updated = updateTaskStatus(task, req.body.status);
    replaceTask(task.id, updated);
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /tasks/overdue-count - nombre de tâches en retard
router.get('/tasks/overdue-count', (req, res) => {
  const tasks = getAllTasks();
  const count = countOverdueTasks(tasks);
  res.status(200).json({ count });
});

export default router;
