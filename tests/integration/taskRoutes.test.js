import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { resetTasks } from '../../src/domain/taskRepository.js';

describe('API /api/tasks', () => {
  beforeEach(() => {
    resetTasks(); // repartir d'un état propre à chaque test
  });

  describe('POST /api/tasks', () => {
    it('crée une tâche valide et retourne un statut 201 (cas nominal)', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Préparer le rapport QA', priority: 'haute', dueDate: '2026-08-01' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: 'Préparer le rapport QA',
        priority: 'haute',
        status: 'à faire',
      });
      expect(response.body.id).toBeDefined();
    });

    it('refuse une tâche sans titre avec un statut 400 (cas d\'erreur)', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '', dueDate: '2026-08-01' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Le titre est obligatoire');
    });

    it('refuse une tâche sans date d\'échéance avec un statut 400 (validation route)', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Tâche sans date' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('La date d\'échéance est obligatoire');
    });
  });

  describe('GET /api/tasks', () => {
    it('retourne la liste des tâches triées par urgence (cas nominal)', async () => {
      await request(app).post('/api/tasks').send({ title: 'Basse prio', priority: 'basse', dueDate: '2020-01-01' });
      await request(app).post('/api/tasks').send({ title: 'Urgente', priority: 'haute', dueDate: '2020-01-01' });

      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Urgente');
    });

    it('retourne une liste vide si aucune tâche n\'existe (cas limite)', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('met à jour le statut d\'une tâche existante (cas nominal)', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Tâche à faire évoluer', dueDate: '2026-08-01' });

      const response = await request(app)
        .patch(`/api/tasks/${created.body.id}/status`)
        .send({ status: 'en cours' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('en cours');
    });

    it('retourne 404 pour une tâche inexistante (cas d\'erreur)', async () => {
      const response = await request(app)
        .patch('/api/tasks/9999/status')
        .send({ status: 'en cours' });

      expect(response.status).toBe(404);
    });

    it('retourne 400 sur une transition interdite (terminée -> à faire)', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Tâche complète', dueDate: '2026-08-01' });

      await request(app).patch(`/api/tasks/${created.body.id}/status`).send({ status: 'en cours' });
      await request(app).patch(`/api/tasks/${created.body.id}/status`).send({ status: 'terminée' });

      const response = await request(app)
        .patch(`/api/tasks/${created.body.id}/status`)
        .send({ status: 'à faire' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch('Transition de statut interdite');
    });
  });

  describe('GET /api/tasks/overdue-count', () => {
    it('retourne le nombre correct de tâches en retard', async () => {
      await request(app).post('/api/tasks').send({ title: 'En retard', dueDate: '2020-01-01' });
      await request(app).post('/api/tasks').send({ title: 'Future', dueDate: '2030-01-01' });

      const response = await request(app).get('/api/tasks/overdue-count');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
    });
  });
});
