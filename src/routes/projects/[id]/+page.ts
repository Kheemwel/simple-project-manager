/**
 * Route Load Function for Project Detail Page: /projects/[id]
 *
 * Disables SSR since Dexie runs inside the client's browser (IndexedDB).
 * Validates the route parameter and retrieves the initial project entity.
 */

import { getProject } from '$lib/data/services';
import { error } from '@sveltejs/kit';

// Dexie.js operates strictly in the browser IndexedDB runtime, so SSR must be disabled for this route.
export const ssr = false;

export async function load({ params }) {
	const id = Number(params.id);

	if (Number.isNaN(id) || id <= 0) {
		throw error(400, 'Invalid project ID');
	}

	const project = await getProject(id);

	if (!project) {
		throw error(404, 'Project not found');
	}

	return {
		id,
		project
	};
}
