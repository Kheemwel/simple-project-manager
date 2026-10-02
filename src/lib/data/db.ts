/**
 * Local IndexedDB Database Configuration using Dexie.js
 *
 * This defines the local-first database schema for Simple Project Manager.
 * All project and task records persist entirely within the user's browser,
 * with no external cloud, server, or authentication dependencies.
 */

import { Dexie, type EntityTable } from 'dexie';
import type { Project, Task } from './models';

/**
 * Extended Dexie instance with typed entity tables for projects and tasks.
 */
const db = new Dexie('ProjectManagerDB') as Dexie & {
	projects: EntityTable<Project, 'id'>;
	tasks: EntityTable<Task, 'id'>;
};

// Schema declaration:
// '++id' specifies an auto-incrementing primary key.
// The other listed fields are indexed for fast lookups, sorting, and queries (e.g. querying tasks by projectId).
db.version(1).stores({
	projects: '++id, name, description, createdAt, lastModified',
	tasks: '++id, projectId, name, description, status, createdAt, lastModified'
});

export { db };
