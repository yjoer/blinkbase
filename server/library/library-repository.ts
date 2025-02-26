import type { Pool, PoolClient } from 'pg';

export class LibraryRepository {
	private pg: Pool | PoolClient;

	constructor(pg: Pool | PoolClient) {
		this.pg = pg;
	}

	findDefaultWorkspace(userId: string) {
		const query = /* sql */ `
			SELECT default_workspace_id
			FROM library.users_settings
			WHERE user_id = $1
		`;

		return this.pg.query(query, [userId]);
	}

	findCollections(workspaceId: string) {
		const query = /* sql */ `
			SELECT collection_id, name
			FROM library.collections
			WHERE workspace_id = $1
			ORDER BY rank
		`;

		return this.pg.query(query, [workspaceId]);
	}

	createCollection(workspaceId: string, name: string) {
		const query = /* sql */ `
			INSERT INTO library.collections (workspace_id, name)
			VALUES ($1, $2)
			RETURNING collection_id
		`;

		return this.pg.query(query, [workspaceId, name]);
	}

	deleteCollection(collectionId: string) {
		const query = /* sql */ `
			WITH RECURSIVE categories AS (
				SELECT category_id, parent_id
				FROM library.categories
				WHERE collection_id = $1 AND parent_id IS NULL
				UNION ALL
				SELECT lc.category_id, lc.parent_id
				FROM library.categories lc
				JOIN categories c ON c.category_id = lc.parent_id
			),
			delete_categories AS (
				DELETE FROM library.categories
				WHERE category_id = ANY(SELECT category_id FROM categories)
			)
			DELETE FROM library.collections
			WHERE collection_id = $1
		`;

		return this.pg.query(query, [collectionId]);
	}

	findCategories(collectionId: string, sort = true) {
		const query = /* sql */ `
			WITH RECURSIVE categories_with_levels AS (
				SELECT category_id, parent_id, name, 0 AS level
				FROM library.categories
				WHERE collection_id = $1 AND parent_id IS NULL
				UNION ALL
				SELECT c.category_id, c.parent_id, c.name, cwl.level + 1
				FROM library.categories c
				JOIN categories_with_levels cwl ON cwl.category_id = c.parent_id
			),
			category_tree AS (
				SELECT cwl.*, NULL::JSONB children
				FROM categories_with_levels cwl
				WHERE cwl.level = (SELECT max(level) FROM categories_with_levels)
				UNION (
					SELECT (branch_parent).*, jsonb_agg(child${sort ? " ORDER BY child->>'category_id'" : ''})
					FROM (
						SELECT branch_parent, jsonb_build_object(
							'category_id', ct.category_id::text,
							'name', ct.name,
							'children', ct.children
						) AS child
						FROM categories_with_levels branch_parent
						JOIN category_tree ct ON ct.parent_id = branch_parent.category_id
					) branch
					GROUP BY branch_parent
					UNION ALL
					SELECT cwl.*, NULL::JSONB
					FROM categories_with_levels cwl
					WHERE NOT EXISTS (
						SELECT 1
						FROM categories_with_levels hypothetical_child
						WHERE hypothetical_child.parent_id = cwl.category_id
					)
				)
			)
			-- SELECT * FROM categories_with_levels
			-- SELECT * FROM category_tree
			SELECT json_agg(json_build_object(
				'category_id', category_id::text,
				'name', name,
				'children', children
			)${sort ? ' ORDER BY category_id' : ''}) AS tree
			FROM category_tree
			WHERE level = 0
		`;

		return this.pg.query(query, [collectionId]);
	}

	createCategory(collectionId: string, name: string, parentId?: string) {
		let query = /* sql */ `
			INSERT INTO library.categories (collection_id, name)
			VALUES ($1, $2)
			RETURNING category_id
		`;

		if (parentId) {
			query = /* sql */ `
				INSERT INTO library.categories (collection_id, parent_id, name)
				VALUES ($1, $2, $3)
				RETURNING category_id
			`;

			return this.pg.query(query, [collectionId, parentId, name]);
		}

		return this.pg.query(query, [collectionId, name]);
	}

	deleteCategory(categoryId: string) {
		const query = /* sql */ `
			WITH RECURSIVE categories AS (
				SELECT category_id, parent_id
				FROM library.categories
				WHERE category_id = $1
				UNION ALL
				SELECT lc.category_id, lc.parent_id
				FROM library.categories lc
				JOIN categories c ON c.category_id = lc.parent_id
			)
			DELETE FROM library.categories
			WHERE category_id = ANY(SELECT category_id FROM categories)
		`;

		return this.pg.query(query, [categoryId]);
	}
}

if (import.meta.vitest) {
	const { it, expect, beforeAll, afterAll } = import.meta.vitest;

	let pool: Pool;
	let client: PoolClient;
	let library: LibraryRepository;

	beforeAll(async () => {
		({ default: pool } = await import('@/lib/postgresql'));
		client = await pool.connect();
		library = new LibraryRepository(client);
	});

	afterAll(async () => {
		await pool.end();
	});

	it('should retrieve categories as a hierarchical tree', async () => {
		const query = /* sql */ `
			WITH workspaces AS (
				INSERT INTO library.workspaces (name)
				VALUES ('Test Workspace')
				RETURNING workspace_id
			),
			collections AS (
				INSERT INTO library.collections (workspace_id, name)
				VALUES ((SELECT workspace_id FROM workspaces), 'Test Collection')
				RETURNING collection_id
			),
			primary_categories AS (
				INSERT INTO library.categories (collection_id, name)
				VALUES
					((SELECT collection_id FROM collections), 'Primary 1'),
					((SELECT collection_id FROM collections), 'Primary 2')
				RETURNING category_id, name
			),
			secondary_categories AS (
				INSERT INTO library.categories (collection_id, parent_id, name)
				VALUES
					((SELECT collection_id FROM collections), (SELECT category_id FROM primary_categories WHERE name = 'Primary 1'), 'Secondary 1'),
					((SELECT collection_id FROM collections), (SELECT category_id FROM primary_categories WHERE name = 'Primary 1'), 'Secondary 2'),
					((SELECT collection_id FROM collections), (SELECT category_id FROM primary_categories WHERE name = 'Primary 1'), 'Secondary 3')
				RETURNING category_id, name
			),
			tertiary_categories AS (
				INSERT INTO library.categories (collection_id, parent_id, name)
				VALUES
					((SELECT collection_id FROM collections), (SELECT category_id FROM secondary_categories WHERE name = 'Secondary 1'), 'Tertiary 1'),
					((SELECT collection_id FROM collections), (SELECT category_id FROM secondary_categories WHERE name = 'Secondary 1'), 'Tertiary 2'),
					((SELECT collection_id FROM collections), (SELECT category_id FROM secondary_categories WHERE name = 'Secondary 2'), 'Tertiary 3'),
					((SELECT collection_id FROM collections), (SELECT category_id FROM secondary_categories WHERE name = 'Secondary 2'), 'Tertiary 4')
			)
			SELECT collection_id
			FROM collections
		`;

		const queryExtended = /* sql */ `
			INSERT INTO library.categories (collection_id, parent_id, name)
			VALUES
				($1, (SELECT category_id FROM library.categories WHERE collection_id = $1 AND name = 'Primary 2'), 'Secondary 1'),
				($1, (SELECT category_id FROM library.categories WHERE collection_id = $1 AND name = 'Primary 2'), 'Secondary 2')
		`;

		const treeA = [
			{
				name: 'Primary 2',
			},
			{
				name: 'Primary 1',
				children: [
					{
						name: 'Secondary 3',
						children: undefined,
					},
					{
						name: 'Secondary 2',
						children: [{ name: 'Tertiary 4' }, { name: 'Tertiary 3' }],
					},
					{
						name: 'Secondary 1',
						children: [{ name: 'Tertiary 2' }, { name: 'Tertiary 1' }],
					},
				],
			},
		];

		const treeB = [
			{
				name: 'Primary 1',
				children: [
					{
						name: 'Secondary 1',
						children: [{ name: 'Tertiary 1' }, { name: 'Tertiary 2' }],
					},
					{
						name: 'Secondary 2',
						children: [{ name: 'Tertiary 3' }, { name: 'Tertiary 4' }],
					},
					{
						name: 'Secondary 3',
						children: undefined,
					},
				],
			},
			{
				name: 'Primary 2',
			},
		];

		const treeC = [
			{
				name: 'Primary 1',
				children: [
					{
						name: 'Secondary 1',
						children: [{ name: 'Tertiary 1' }, { name: 'Tertiary 2' }],
					},
					{
						name: 'Secondary 2',
						children: [{ name: 'Tertiary 3' }, { name: 'Tertiary 4' }],
					},
					{
						name: 'Secondary 3',
						children: undefined,
					},
				],
			},
			{
				name: 'Primary 2',
				children: [{ name: 'Secondary 1' }, { name: 'Secondary 2' }],
			},
		];

		await client.query('BEGIN');

		const { rows: collections } = await client.query(query);
		const collectionId = collections[0].collection_id;

		const { rows: rowsA } = await library.findCategories(collectionId, false);
		const { tree: retrievedTreeA } = rowsA[0];

		const { rows: rowsB } = await library.findCategories(collectionId, true);
		const { tree: retrievedTreeB } = rowsB[0];

		await client.query(queryExtended, [collectionId]);

		const { rows: rowsC } = await library.findCategories(collectionId, true);
		const { tree: retrievedTreeC } = rowsC[0];

		await client.query('ROLLBACK');
		client.release();

		expect(retrievedTreeA).toMatchObject(treeA);
		expect(retrievedTreeB).toMatchObject(treeB);
		expect(retrievedTreeC).toMatchObject(treeC);
	});
}
