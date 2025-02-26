import { base32nopad } from '@scure/base';
import * as stylex from '@stylexjs/stylex';
import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Collapsible, DropdownMenu } from 'radix-ui';
import { useState } from 'react';
import {
	LuChevronDown,
	LuChevronRight,
	LuChevronsUpDown,
	LuEllipsis,
	LuGalleryVerticalEnd,
	LuGitBranchPlus,
	LuPenLine,
	LuTrash2,
} from 'react-icons/lu';
import { TbOctahedronPlus } from 'react-icons/tb';

import { Sidebar, sidebar_menu_button_styles } from '@/components/sidebar';
import { orpc } from '@/lib/orpc';

export function CollectionsPane() {
	const result = useSuspenseQueries({
		queries: [
			orpc.library.find_collections.queryOptions({ input: {} }),
			orpc.users.find_by_id.queryOptions(),
		],
	});

	const collections = result[0].data;
	const user = result[1].data;

	const categories = useSuspenseQueries({
		queries: collections.map((collection) => {
			return orpc.library.find_categories.queryOptions({
				input: {
					collection_id: collection.collection_id,
				},
			});
		}),
	});

	return (
		<Sidebar>
			<div className="flex flex-col p-2">
				<button type="button" {...stylex.props(sidebar_menu_button_styles.base)}>
					<div className="flex size-8 items-center justify-center rounded-lg bg-black text-white">
						<LuGalleryVerticalEnd />
					</div>
					<div className="flex flex-col gap-1 text-left">
						<div className="text-sm/none font-semibold">Acme Inc</div>
						<div className="text-xs/none">Enterprise</div>
					</div>
					<LuChevronsUpDown className="ml-auto" />
				</button>
			</div>
			<div className="flex grow flex-col gap-1 overflow-auto p-2">
				<SidebarActions />
				{collections.map((collection, i) => {
					return (
						<div key={collection.collection_id}>
							<Collection name={collection.name} collection_id={collection.collection_id} />
							{categories[i].data?.map((category) => {
								return (
									<CategoryTree
										key={category.category_id}
										collection_id={collection.collection_id}
										node={category}
									/>
								);
							})}
						</div>
					);
				})}
			</div>
			<div className="mt-auto flex flex-col p-2">
				<button type="button" {...stylex.props(sidebar_menu_button_styles.base)}>
					<img
						alt=""
						className="size-8 rounded-lg object-cover"
						src="https://api.dicebear.com/9.x/initials/svg?seed=someone.else"
					/>
					<div className="flex flex-col gap-1 text-left">
						<div className="text-sm/none font-semibold">
							{user.first_name} {user.last_name}
						</div>
						<div className="text-xs/none">{user.email_address}</div>
					</div>
					<LuChevronsUpDown className="ml-auto" />
				</button>
			</div>
		</Sidebar>
	);
}

function SidebarActions() {
	const query_client = useQueryClient();

	const create_collection = useMutation(
		orpc.library.create_collection.mutationOptions({
			onSuccess: () => {
				void query_client.invalidateQueries({
					queryKey: orpc.library.find_collections.queryKey({ input: {} }),
				});
			},
		}),
	);

	const handle_create_collection = () => {
		create_collection.mutate({ name: 'Untitled' });
	};

	return (
		<button
			type="button"
			onClick={handle_create_collection}
			{...stylex.props(sidebar_menu_button_styles.base, sidebar_actions_styles.button)}>
			<TbOctahedronPlus className="text-base text-[oklch(32%_0_0)]" />
			Create Collection
		</button>
	);
}

const sidebar_actions_styles = stylex.create({
	button: {
		paddingBlock: 6,
		fontSize: '0.875rem',
		lineHeight: 1.25 / 0.875,
	},
});

interface CollectionProps {
	collection_id: string;
	name: string;
}

function Collection({ collection_id, name }: CollectionProps) {
	const query_client = useQueryClient();

	const create_collection = useMutation(
		orpc.library.create_category.mutationOptions({
			onSuccess: () => {
				void query_client.invalidateQueries({
					queryKey: orpc.library.find_categories.queryKey({ input: { collection_id } }),
				});
			},
		}),
	);

	const delete_collection = useMutation(
		orpc.library.delete_collection.mutationOptions({
			onSuccess: () => {
				void query_client.invalidateQueries({
					queryKey: orpc.library.find_collections.queryKey({ input: {} }),
				});
			},
		}),
	);

	const handle_create = () => {
		create_collection.mutate({ collection_id, name: 'Untitled' });
	};

	const handle_delete = () => {
		delete_collection.mutate({ collection_id });
	};

	return (
		<div {...stylex.props(stylex.defaultMarker(), collection_styles.base)}>
			{name}
			<DropdownMenu.Root modal={false}>
				<DropdownMenu.Trigger {...stylex.props(collection_styles.trigger)}>
					<LuEllipsis className="text-base" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className="w-48 rounded-lg border border-[oklch(92%_0_0)] bg-white p-1 shadow-md"
						side="right"
						sideOffset={4}>
						<DropdownMenu.Item
							onClick={handle_create}
							{...stylex.props(sidebar_menu_button_styles.base, collection_styles.button)}>
							<LuGitBranchPlus className="text-base text-[oklch(56%_0_0)]" />
							Add Category
						</DropdownMenu.Item>
						<DropdownMenu.Item
							{...stylex.props(sidebar_menu_button_styles.base, collection_styles.button)}>
							<LuPenLine className="text-base text-[oklch(56%_0_0)]" />
							Rename
						</DropdownMenu.Item>
						<DropdownMenu.Separator className="-mx-1 my-1 h-px bg-[oklch(96%_0_0)]" />
						<DropdownMenu.Item
							onClick={handle_delete}
							{...stylex.props(sidebar_menu_button_styles.base, collection_styles.button)}>
							<LuTrash2 className="text-base text-[oklch(56%_0_0)]" />
							Delete Collection
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	);
}

const collection_styles = stylex.create({
	base: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		padding: 8,
		fontSize: '0.75rem',
		fontWeight: 500,
		lineHeight: 'calc(1 / 0.75)',
		color: 'oklch(32% 0 0 / 64%)',
	},
	trigger: {
		position: 'absolute',
		top: 4,
		right: 4,
		padding: 4,
		cursor: 'pointer',
		backgroundColor: {
			':hover': 'oklch(96% 0 0)',
		},
		borderRadius: 6,
		opacity: {
			default: 0,
			[stylex.when.ancestor(':hover')]: 100,
			':hover': 100,
		},
	},
	button: {
		paddingBlock: 6,
		fontSize: '0.875rem',
		lineHeight: 1.25 / 0.875,
	},
});

interface TreeNode {
	category_id: string;
	children?: TreeNode[];
	name: string;
	open?: boolean;
}

interface CategoryTreeProps {
	collection_id: string;
	node: TreeNode;
}

function CategoryTree({ collection_id, node }: CategoryTreeProps) {
	const query_client = useQueryClient();

	const create_category = useMutation(
		orpc.library.create_category.mutationOptions({
			onSuccess: () => {
				void query_client.invalidateQueries({
					queryKey: orpc.library.find_categories.queryKey({ input: { collection_id } }),
				});
			},
		}),
	);

	const delete_category = useMutation(
		orpc.library.delete_category.mutationOptions({
			onSuccess: () => {
				void query_client.invalidateQueries({
					queryKey: orpc.library.find_categories.queryKey({ input: { collection_id } }),
				});
			},
		}),
	);

	const handle_create = () => {
		create_category.mutate({ collection_id, parent_id: node.category_id, name: 'Untitled' });
	};

	const handle_delete = () => {
		delete_category.mutate({ category_id: node.category_id });
	};

	const [open, set_open] = useState(node.open ?? false);

	const bytes = toBytes(node.category_id, 8);
	const id = base32nopad.encode(bytes).toLowerCase();

	const has_children = node.children && node.children.length > 0;

	return (
		<Collapsible.Root className="relative" open={open} onOpenChange={set_open}>
			<Link
				search={{ cat: id }}
				to="/library"
				{...stylex.props(
					stylex.defaultMarker(),
					sidebar_menu_button_styles.base,
					category_tree_styles.button,
					has_children && category_tree_styles.button_padded,
				)}>
				<div className="size-4 shrink-0 bg-black/8" />
				<div className="truncate">{node.name}</div>
			</Link>
			{!!has_children && (
				<Collapsible.Trigger {...stylex.props(category_tree_styles.trigger)}>
					{!!open && <LuChevronDown className="text-base" />}
					{!open && <LuChevronRight className="text-base" />}
				</Collapsible.Trigger>
			)}
			<DropdownMenu.Root modal={false}>
				<DropdownMenu.Trigger {...stylex.props(category_tree_styles.menu_trigger)}>
					<LuEllipsis />
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className="w-48 rounded-lg border border-[oklch(92%_0_0)] bg-white p-1 shadow-md"
						side="right"
						sideOffset={4}>
						<DropdownMenu.Item
							onClick={handle_create}
							{...stylex.props(sidebar_menu_button_styles.base, category_tree_styles.button)}>
							<LuGitBranchPlus className="text-base text-[oklch(56%_0_0)]" />
							Add Category
						</DropdownMenu.Item>
						<DropdownMenu.Item
							{...stylex.props(sidebar_menu_button_styles.base, category_tree_styles.button)}>
							<LuPenLine className="text-base text-[oklch(56%_0_0)]" />
							Rename
						</DropdownMenu.Item>
						<DropdownMenu.Separator className="-mx-1 my-1 h-px bg-[oklch(96%_0_0)]" />
						<DropdownMenu.Item
							onClick={handle_delete}
							{...stylex.props(sidebar_menu_button_styles.base, category_tree_styles.button)}>
							<LuTrash2 className="text-base text-[oklch(56%_0_0)]" />
							Delete Category
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
			{!!has_children && (
				<Collapsible.Content
					className="ml-4 flex flex-col gap-1 border-l border-[oklch(92%_0_0)] pl-2">
					{node.children?.map(child => (
						<CategoryTree key={child.name} collection_id={collection_id} node={child} />
					))}
				</Collapsible.Content>
			)}
		</Collapsible.Root>
	);
}

const category_tree_styles = stylex.create({
	button: {
		paddingBlock: 6,
		fontSize: '0.875rem',
		lineHeight: 1.25 / 0.875,
	},
	button_padded: {
		paddingLeft: 32,
	},
	trigger: {
		position: 'absolute',
		top: 4,
		left: 4,
		padding: 4,
		cursor: 'pointer',
		outline: 'none',
		backgroundColor: {
			':hover': 'oklch(96% 0 0)',
		},
		borderRadius: 6,
	},
	menu_trigger: {
		position: 'absolute',
		top: 4,
		right: 4,
		padding: 4,
		cursor: 'pointer',
		backgroundColor: {
			':hover': 'oklch(96% 0 0)',
		},
		borderRadius: 6,
		opacity: {
			default: 0,
			[stylex.when.siblingBefore(':hover')]: 100,
			':hover': 100,
		},
	},
});

function toBytes(str: string, length: number) {
	let bigint = BigInt(str);
	const bytes = new Uint8Array(length);

	for (let i = length - 1; i >= 0; i--) {
		bytes[i] = Number(bigint & 0xFFn);
		bigint >>= 8n;
	}

	return bytes;
}
