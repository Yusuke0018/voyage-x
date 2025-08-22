'use client';

import { useState, useEffect, useCallback } from 'react';
import { initDatabase, executeQuery, executeInsert } from '@/lib/db/client';
import type { Goal, Milestone, Task, EmotionLog } from '@/lib/types';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setIsReady(true))
      .catch(err => setError(err.message));
  }, []);

  // Goals CRUD
  const createGoal = useCallback(async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await executeInsert(
      'INSERT INTO goals (id, title, description, target_date, vision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, goal.title, goal.description, goal.targetDate.toISOString(), goal.vision || null, now, now]
    );
    
    return id;
  }, []);

  const getGoals = useCallback(async (): Promise<Goal[]> => {
    const results = await executeQuery('SELECT * FROM goals ORDER BY created_at DESC');
    return results.map(row => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      targetDate: new Date(row.target_date as string),
      vision: row.vision as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    }));
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    const fields = [];
    const values = [];
    
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.targetDate !== undefined) {
      fields.push('target_date = ?');
      values.push(updates.targetDate.toISOString());
    }
    if (updates.vision !== undefined) {
      fields.push('vision = ?');
      values.push(updates.vision);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await executeQuery(
      `UPDATE goals SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    await executeQuery('DELETE FROM goals WHERE id = ?', [id]);
  }, []);

  // Milestones CRUD
  const createMilestone = useCallback(async (milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await executeInsert(
      'INSERT INTO milestones (id, goal_id, title, description, target_date, completed, order_num, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, milestone.goalId, milestone.title, milestone.description || null, milestone.targetDate.toISOString(), milestone.completed ? 1 : 0, milestone.order, now, now]
    );
    
    return id;
  }, []);

  const getMilestonesByGoal = useCallback(async (goalId: string): Promise<Milestone[]> => {
    const results = await executeQuery(
      'SELECT * FROM milestones WHERE goal_id = ? ORDER BY order_num ASC',
      [goalId]
    );
    
    return results.map(row => ({
      id: row.id as string,
      goalId: row.goal_id as string,
      title: row.title as string,
      description: row.description as string | undefined,
      targetDate: new Date(row.target_date as string),
      completed: row.completed === 1,
      order: row.order_num as number,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    }));
  }, []);

  // Tasks CRUD
  const createTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await executeInsert(
      'INSERT INTO tasks (id, milestone_id, title, description, status, priority, due_date, completed_at, dependencies, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        task.milestoneId,
        task.title,
        task.description || null,
        task.status,
        task.priority,
        task.dueDate?.toISOString() || null,
        task.completedAt?.toISOString() || null,
        task.dependencies ? JSON.stringify(task.dependencies) : null,
        now,
        now
      ]
    );
    
    return id;
  }, []);

  const getTasksByMilestone = useCallback(async (milestoneId: string): Promise<Task[]> => {
    const results = await executeQuery(
      'SELECT * FROM tasks WHERE milestone_id = ? ORDER BY priority DESC, created_at ASC',
      [milestoneId]
    );
    
    return results.map(row => ({
      id: row.id as string,
      milestoneId: row.milestone_id as string,
      title: row.title as string,
      description: row.description as string | undefined,
      status: row.status as Task['status'],
      priority: row.priority as Task['priority'],
      dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
      dependencies: row.dependencies ? JSON.parse(row.dependencies as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    }));
  }, []);

  const updateTaskStatus = useCallback(async (id: string, status: Task['status']) => {
    const now = new Date().toISOString();
    const completedAt = status === 'done' ? now : null;
    
    await executeQuery(
      'UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?',
      [status, completedAt, now, id]
    );
  }, []);

  // Emotion Logs
  const saveEmotionLog = useCallback(async (log: Omit<EmotionLog, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dateStr = log.date.toISOString().split('T')[0];
    
    // Upsert: 同じ日付があれば更新、なければ挿入
    await executeQuery(
      'INSERT OR REPLACE INTO emotion_logs (id, date, mood, energy, note, created_at) VALUES ((SELECT id FROM emotion_logs WHERE date = ?), ?, ?, ?, ?, ?)',
      [dateStr, dateStr, log.mood, log.energy, log.note || null, now]
    );
  }, []);

  const getEmotionLogs = useCallback(async (limit: number = 30): Promise<EmotionLog[]> => {
    const results = await executeQuery(
      'SELECT * FROM emotion_logs ORDER BY date DESC LIMIT ?',
      [limit]
    );
    
    return results.map(row => ({
      id: row.id as string,
      date: new Date(row.date as string),
      mood: row.mood as 1 | 2 | 3 | 4 | 5,
      energy: row.energy as 1 | 2 | 3 | 4 | 5,
      note: row.note as string | undefined,
      createdAt: new Date(row.created_at as string)
    }));
  }, []);

  return {
    isReady,
    error,
    // Goals
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    // Milestones
    createMilestone,
    getMilestonesByGoal,
    // Tasks
    createTask,
    getTasksByMilestone,
    updateTaskStatus,
    // Emotion Logs
    saveEmotionLog,
    getEmotionLogs
  };
}