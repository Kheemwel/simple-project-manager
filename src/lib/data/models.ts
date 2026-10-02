/**
 * Data Models & Types for Simple Project Manager
 *
 * This file defines the core TypeScript interfaces, types, and constants
 * used across the Dexie IndexedDB layer and UI components.
 */

/**
 * Represents a project stored locally in Dexie.
 */
export interface Project {
	id: number;
	name: string;
	description: string;
	createdAt: Date;
	lastModified: Date;
}

/**
 * Shape of data required to create a new project.
 * ID and timestamps are auto-managed by the service layer.
 */
export type NewProject = Omit<Project, 'id' | 'createdAt' | 'lastModified'>;

/**
 * Shape of data allowed when updating an existing project.
 */
export type UpdateProject = Partial<NewProject>;

/**
 * Standard task status lifecycle values.
 */
export const TASK_STATUSES = [
	'Not Started',
	'In Progress',
	'In Review',
	'Completed',
	'Blocked',
	'On Hold'
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Configuration and styling tokens for each task status badge.
 * Provides consistent colors and labels across both light and dark modes.
 */
export const STATUS_CONFIG: Record<
	TaskStatus,
	{
		label: string;
		badgeClass: string;
		dotClass: string;
	}
> = {
	'Not Started': {
		label: 'Not Started',
		badgeClass: 'bg-muted text-muted-foreground border-border',
		dotClass: 'bg-muted-foreground/60'
	},
	'In Progress': {
		label: 'In Progress',
		badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
		dotClass: 'bg-blue-500'
	},
	'In Review': {
		label: 'In Review',
		badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
		dotClass: 'bg-purple-500'
	},
	'Completed': {
		label: 'Completed',
		badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
		dotClass: 'bg-emerald-500'
	},
	'Blocked': {
		label: 'Blocked',
		badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
		dotClass: 'bg-rose-500'
	},
	'On Hold': {
		label: 'On Hold',
		badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
		dotClass: 'bg-amber-500'
	}
};

/**
 * Represents an individual task associated with a project.
 */
export interface Task {
	id: number;
	projectId: number;
	name: string;
	description: string;
	status: TaskStatus;
	createdAt: Date;
	lastModified: Date;
}

/**
 * Shape of data required to create a new task.
 * ID and timestamps are auto-managed by the service layer.
 */
export type NewTask = Omit<Task, 'id' | 'createdAt' | 'lastModified'>;

/**
 * Shape of data allowed when updating an existing task.
 */
export type UpdateTask = Partial<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'lastModified'>>;
