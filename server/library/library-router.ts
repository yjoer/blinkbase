import { z } from 'zod';

import { auth } from '@/app/middleware';
import pool from '@/lib/postgresql';

import { LibraryRepository } from './library-repository';

const library = new LibraryRepository(pool);

export const find_collections = auth
.input(
	z.object({
		workspace_id: z.string().optional(),
	}),
)
.handler(async ({ context, input }) => {
	const { user_id } = context;
	let { workspace_id } = input;

	if (!workspace_id) {
		const { rows } = await library.findDefaultWorkspace(user_id);
		workspace_id = rows[0].default_workspace_id as string;
	}

	const { rows } = await library.findCollections(workspace_id);
	return rows;
});

export const create_collection = auth
.input(
	z.object({
		workspace_id: z.string().optional(),
		name: z.string(),
	}),
)
.handler(async ({ context, input }) => {
	const { user_id } = context;
	const { name } = input;
	let { workspace_id } = input;

	if (!workspace_id) {
		const { rows: settings } = await library.findDefaultWorkspace(user_id);
		workspace_id = settings[0].default_workspace_id as string;
	}

	await library.createCollection(workspace_id, name);
});

export const delete_collection = auth
.input(
	z.object({
		collection_id: z.string(),
	}),
)
.handler(async ({ input }) => {
	const { collection_id } = input;
	await library.deleteCollection(collection_id);
});

export const find_categories = auth
.input(
	z.object({
		collection_id: z.string(),
	}),
)
.handler(async ({ input }) => {
	const { collection_id } = input;

	// check if the user has access to the workspace/collection

	const { rows } = await library.findCategories(collection_id);
	const { tree } = rows[0];

	return tree;
});

export const create_category = auth
.input(
	z.object({
		collection_id: z.string(),
		parent_id: z.string().optional(),
		name: z.string(),
	}),
)
.handler(async ({ input }) => {
	const { collection_id, parent_id, name } = input;
	await library.createCategory(collection_id, name, parent_id);
});

export const delete_category = auth
.input(
	z.object({
		category_id: z.string(),
	}),
)
.handler(async ({ input }) => {
	const { category_id } = input;
	await library.deleteCategory(category_id);
});
