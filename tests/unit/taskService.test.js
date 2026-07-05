import { describe, it, expect, beforeEach } from 'vitest';
import { createTask, isOverdue, updateTaskStatus, sortTasksByUrgency, countOverdueTasks } from '../../src/domain/taskService.js';

describe('taskService - createTask', () => {
  it('refuse la création d\'une tâche sans titre', () => {
    expect(() => createTask({ title: '' })).toThrow('Le titre est obligatoire');
  });

  it('refuse une priorité qui n\'est pas dans la liste autorisée', () => {
    expect(() => createTask({ title: 'Tâche test', priority: 'urgent-max' }))
      .toThrow('Priorité invalide');
  });

  it('accepte une priorité valide (cas nominal)', () => {
    const task = createTask({ title: 'Tâche test', priority: 'haute' });
    expect(task.priority).toBe('haute');
  });

  it('applique une priorité par défaut si aucune n\'est fournie', () => {
    const task = createTask({ title: 'Tâche test' });
    expect(task.priority).toBe('moyenne');
  });
});

describe('taskService - isOverdue', () => {
  it('détecte une tâche en retard (date d\'échéance passée, non terminée) - cas nominal', () => {
    const task = { status: 'à faire', dueDate: '2020-01-01' };
    expect(isOverdue(task, new Date('2026-07-05'))).toBe(true);
  });

  it('ne considère pas une tâche terminée comme en retard, même si la date est passée', () => {
    const task = { status: 'terminée', dueDate: '2020-01-01' };
    expect(isOverdue(task, new Date('2026-07-05'))).toBe(false);
  });

  it('ne considère pas une tâche due aujourd\'hui comme en retard (cas limite)', () => {
    const task = { status: 'à faire', dueDate: '2026-07-05' };
    expect(isOverdue(task, new Date('2026-07-05'))).toBe(false);
  });

  it('lève une erreur si la tâche n\'a pas de date d\'échéance (cas d\'erreur)', () => {
    const task = { status: 'à faire' };
    expect(() => isOverdue(task, new Date('2026-07-05'))).toThrow('Date d\'échéance manquante');
  });
});

describe('taskService - updateTaskStatus', () => {
  it('autorise le passage de "à faire" à "en cours" (cas nominal)', () => {
    const task = { status: 'à faire' };
    const updated = updateTaskStatus(task, 'en cours');
    expect(updated.status).toBe('en cours');
  });

  it('refuse le passage direct de "terminée" à "à faire" (cas d\'erreur métier)', () => {
    const task = { status: 'terminée' };
    expect(() => updateTaskStatus(task, 'à faire'))
      .toThrow('Transition de statut interdite : une tâche terminée doit repasser par "en cours"');
  });

  it('refuse un statut qui n\'existe pas (cas d\'erreur)', () => {
    const task = { status: 'à faire' };
    expect(() => updateTaskStatus(task, 'annulee')).toThrow('Statut invalide');
  });
});

describe('taskService - sortTasksByUrgency', () => {
  it('place les tâches en retard ET de priorité haute en premier (cas nominal)', () => {
    const tasks = [
      { title: 'A', status: 'à faire', priority: 'basse', dueDate: '2020-01-01' },
      { title: 'B', status: 'à faire', priority: 'haute', dueDate: '2020-01-01' },
      { title: 'C', status: 'à faire', priority: 'moyenne', dueDate: '2030-01-01' },
    ];
    const sorted = sortTasksByUrgency(tasks, new Date('2026-07-05'));
    expect(sorted[0].title).toBe('B');
  });

  it('ne change pas l\'ordre si aucune tâche n\'est urgente (cas limite)', () => {
    const tasks = [
      { title: 'A', status: 'à faire', priority: 'basse', dueDate: '2030-01-01' },
      { title: 'B', status: 'à faire', priority: 'moyenne', dueDate: '2030-01-01' },
    ];
    const sorted = sortTasksByUrgency(tasks, new Date('2026-07-05'));
    expect(sorted.map(t => t.title)).toEqual(['A', 'B']);
  });

  it('gère une liste vide sans erreur (cas limite)', () => {
    expect(sortTasksByUrgency([], new Date('2026-07-05'))).toEqual([]);
  });
});

describe('taskService - countOverdueTasks', () => {
  it('compte correctement les tâches en retard (cas nominal)', () => {
    const tasks = [
      { status: 'à faire', dueDate: '2020-01-01' },
      { status: 'terminée', dueDate: '2020-01-01' },
      { status: 'à faire', dueDate: '2030-01-01' },
    ];
    expect(countOverdueTasks(tasks, new Date('2026-07-05'))).toBe(1);
  });

  it('retourne 0 sur une liste vide (cas limite)', () => {
    expect(countOverdueTasks([], new Date('2026-07-05'))).toBe(0);
  });
});
