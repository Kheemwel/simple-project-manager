/**
 * Data Access & Business Logic Services
 *
 * Provides reactive live queries (via Dexie liveQuery) and CRUD operations
 * for Projects and Tasks. Dexie's liveQuery implements the Svelte Subscribable/Store
 * contract, meaning UI components can use the `$projects` or `$projectLive` store syntax
 * to reactively receive database updates in real time.
 */

import { liveQuery } from 'dexie';
import { db } from './db';
import type { NewProject, NewTask, TaskStatus, UpdateProject, UpdateTask } from './models';

// ==========================================
// Projects Services
// ==========================================

/**
 * Live observable query returning all projects.
 * Auto-updates any subscribed Svelte components when projects are added, updated, or removed.
 */
export const projects = liveQuery(() => db.projects.toArray());

/**
 * Live observable query returning all tasks across all projects.
 * Useful for aggregate stats (e.g. counting tasks and completion rate per project on the home screen).
 */
export const allTasks = liveQuery(() => db.tasks.toArray());

/**
 * Fetches a single project by its primary ID.
 * @param id Project ID
 * @returns Project object or undefined if not found
 */
export async function getProject(id: number) {
	return await db.projects.get(id);
}

/**
 * Creates a reactive live query for a single project.
 * Allows project detail pages to react instantly if project details are edited.
 * @param id Project ID
 */
export const projectLive = (id: number) => liveQuery(() => db.projects.get(id));

/**
 * Adds a new project to the database.
 * Sets the initial createdAt and lastModified timestamps.
 * @param project The project payload (name, description)
 * @returns The newly created project ID
 */
export async function addProject(project: NewProject): Promise<number> {
	const now = new Date();
	const id = await db.projects.add({
		...project,
		createdAt: now,
		lastModified: now
	});
	return Number(id);
}

/**
 * Updates an existing project and refreshes its lastModified timestamp.
 * @param id Project ID
 * @param updates Partial project fields to update
 */
export async function updateProject(id: number, updates: UpdateProject) {
	await db.projects.update(id, {
		...updates,
		lastModified: new Date()
	});
}

/**
 * Deletes a project and all associated tasks in a single atomic transaction.
 * Ensures no orphaned tasks remain in the database.
 * @param id Project ID to delete
 */
export async function deleteProject(id: number) {
	await db.transaction('rw', [db.projects, db.tasks], async () => {
		// 1. Delete all tasks under this project
		await db.tasks.where('projectId').equals(id).delete();
		// 2. Delete the project itself
		await db.projects.delete(id);
	});
}

// ==========================================
// Tasks Services
// ==========================================

/**
 * Creates a reactive live query for all tasks under a specific project.
 * Subscribed components will re-render automatically on any task addition, edit, or deletion.
 * @param projectId Project ID
 */
export const tasks = (projectId: number) =>
	liveQuery(() => db.tasks.where('projectId').equals(projectId).toArray());

/**
 * Fetches a single task by its ID.
 * @param id Task ID
 */
export async function getTask(id: number) {
	return await db.tasks.get(id);
}

/**
 * Adds a new task to a project and bumps the project's lastModified timestamp.
 * @param task The task payload (projectId, name, description, status)
 * @returns The newly created task ID
 */
export async function addTask(task: NewTask): Promise<number> {
	const now = new Date();
	const id = await db.tasks.add({
		...task,
		createdAt: now,
		lastModified: now
	});

	// Update the parent project's last modified timestamp
	await db.projects.update(task.projectId, { lastModified: now });

	return Number(id);
}

/**
 * Updates a task and refreshes both the task's and its parent project's lastModified timestamp.
 * @param id Task ID
 * @param updates Partial task fields to update (name, description, status)
 */
export async function updateTask(id: number, updates: UpdateTask) {
	const existingTask = await db.tasks.get(id);
	if (!existingTask) return;

	const now = new Date();
	// Update the task record
	await db.tasks.update(id, {
		...updates,
		lastModified: now
	});

	// Update parent project's last modified date
	await db.projects.update(existingTask.projectId, { lastModified: now });
}

/**
 * Quickly updates a task's status.
 * @param id Task ID
 * @param status New TaskStatus
 */
export async function updateTaskStatus(id: number, status: TaskStatus) {
	await updateTask(id, { status });
}

/**
 * Deletes a task by ID and updates the parent project's lastModified timestamp.
 * @param id Task ID to delete
 */
export async function deleteTask(id: number) {
	const task = await db.tasks.get(id);
	if (!task) return;

	await db.tasks.delete(id);
	// Update the parent project's last modified date
	await db.projects.update(task.projectId, { lastModified: new Date() });
}
