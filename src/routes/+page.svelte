<script lang="ts">
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';

	import ArrowDownWideNarrow from '@lucide/svelte/icons/arrow-down-wide-narrow';
	import ArrowUpNarrowWide from '@lucide/svelte/icons/arrow-up-narrow-wide';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import FolderKanban from '@lucide/svelte/icons/folder-kanban';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Trash from '@lucide/svelte/icons/trash';

	import { addProject, allTasks, deleteProject, projects, updateProject } from '$lib/data/services';
	import { resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';

	const SORT = {
		lastModified: 'Last modified',
		createdAt: 'Date created',
		name: 'Name'
	} as const;
	type SortKey = keyof typeof SORT;

	const dateFormat = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});

	function timeAgo(input: Date | string | number): string {
		const date = new Date(input);
		if (Number.isNaN(date.getTime())) return '';
		const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
		if (secs < 60) return 'Just now';
		const mins = Math.floor(secs / 60);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days === 1) return 'Yesterday';
		if (days < 30) return `${days}d ago`;
		return dateFormat.format(date);
	}

	// ---------- state ----------
	let search = $state('');
	let sort = $state<SortKey>('lastModified');
	let descending = $state(true);
	let searchEl = $state<HTMLInputElement | null>(null);

	// form dialog (editingId === null → creating)
	let formOpen = $state(false);
	let editingId = $state<number | null>(null);
	let name = $state('');
	let description = $state('');

	// delete dialog
	let toDelete = $state<{ id: number; name: string } | null>(null);

	// ---------- derived ----------
	const stats = $derived.by(() => {
		const map = new SvelteMap<number, { total: number; done: number }>();
		for (const t of $allTasks ?? []) {
			const s = map.get(t.projectId) ?? { total: 0, done: 0 };
			s.total++;
			if (t.status === 'Completed') s.done++;
			map.set(t.projectId, s);
		}
		return map;
	});

	const visible = $derived.by(() => {
		const q = search.trim().toLowerCase();
		const dir = descending ? -1 : 1;

		return ($projects ?? [])
			.filter(
				(p) =>
					!q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
			)
			.sort((a, b) =>
				sort === 'name'
					? a.name.localeCompare(b.name) * dir
					: (new Date(a[sort]).getTime() - new Date(b[sort]).getTime()) * dir
			);
	});

	// ---------- actions ----------
	function openCreate() {
		editingId = null;
		name = '';
		description = '';
		formOpen = true;
	}

	function openEdit(p: { id: number; name: string; description?: string }) {
		editingId = p.id;
		name = p.name;
		description = p.description ?? '';
		formOpen = true;
	}

	async function save() {
		const data = { name: name.trim(), description: description.trim() };
		if (!data.name) return;

		if (editingId === null) await addProject(data);
		else await updateProject(editingId, data);

		formOpen = false;
	}

	async function confirmDelete() {
		if (!toDelete) return;
		await deleteProject(toDelete.id);
		toDelete = null;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			searchEl?.focus();
		}
	}}
/>

<div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
	<!-- Top Navigation / Header -->
	<header class="flex items-center justify-between border-b pb-3">
		<div class="flex items-center gap-2.5">
			<div
				class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
			>
				<FolderKanban class="size-5" />
			</div>
			<div>
				<h1 class="text-lg font-bold tracking-tight sm:text-xl">Projects</h1>
				<p class="hidden text-xs text-muted-foreground sm:block">
					Manage and track your local workflows
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<ThemeSwitcher />
			<Button onclick={openCreate} size="sm" class="h-9 px-3 text-xs sm:text-sm">
				<Plus class="mr-1.5 size-4" /> New Project
			</Button>
		</div>
	</header>

	<!-- Search & Sort Controls Toolbar -->
	<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
		<InputGroup.Root class="w-full sm:max-w-xs">
			<InputGroup.Addon>
				<Search class="size-4 text-muted-foreground" />
			</InputGroup.Addon>
			<InputGroup.Input bind:ref={searchEl} bind:value={search} placeholder="Search projects…" />
			<InputGroup.Addon align="inline-end">
				<Kbd class="hidden sm:inline-flex">⌘K</Kbd>
			</InputGroup.Addon>
		</InputGroup.Root>

		<div class="flex items-center gap-2 self-end sm:self-auto">
			<Select.Root type="single" bind:value={sort}>
				<Select.Trigger class="h-9 w-36 text-xs">
					<span class="mr-1 text-muted-foreground">Sort:</span>
					{SORT[sort]}
				</Select.Trigger>
				<Select.Content>
					{#each Object.entries(SORT) as [value, label] (value)}
						<Select.Item {value} {label}>{label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<Button
				variant="outline"
				size="icon"
				class="size-9"
				aria-label={descending ? 'Descending' : 'Ascending'}
				onclick={() => (descending = !descending)}
			>
				{#if descending}
					<ArrowDownWideNarrow class="size-4" />
				{:else}
					<ArrowUpNarrowWide class="size-4" />
				{/if}
			</Button>
		</div>
	</div>

	<!-- Main Content Grid -->
	{#if visible.length > 0}
		<ul class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
			{#each visible as p (p.id)}
				{@const s = stats.get(p.id) ?? { total: 0, done: 0 }}
				{@const percent = s.total ? Math.round((s.done / s.total) * 100) : 0}
				<li class="h-full">
					<Card.Root
						class="group relative flex h-full flex-col justify-between transition-all hover:border-foreground/20 hover:shadow-sm"
					>
						<Card.Header class="p-4 pb-2">
							<div class="flex items-start justify-between gap-2">
								<Card.Title class="truncate text-sm leading-tight font-semibold">
									<a
										href={resolve('/projects/[id]', { id: String(p.id) })}
										class="transition-colors after:absolute after:inset-0 hover:text-primary"
									>
										{p.name}
									</a>
								</Card.Title>

								<!-- Dropdown Menu Options -->
								<div class="relative z-10 -mt-1 -mr-1">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="icon"
													class="size-7 text-muted-foreground hover:text-foreground"
												>
													<EllipsisVertical class="size-4" />
													<span class="sr-only">Project options</span>
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item onSelect={() => openEdit(p)}>
												<SquarePen class="mr-2 size-4" /> Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item
												class="text-destructive focus:text-destructive"
												onSelect={() => (toDelete = { id: p.id, name: p.name })}
											>
												<Trash class="mr-2 size-4" /> Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
							</div>

							<Card.Description class="mt-1 line-clamp-2 text-xs text-muted-foreground">
								{p.description || 'No description provided.'}
							</Card.Description>
						</Card.Header>

						<div class="mt-2">
							<Card.Content class="px-4 pt-0 pb-3">
								<div class="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
									<span>{s.total ? `${s.done}/${s.total} completed` : 'No tasks'}</span>
									<span class="font-medium text-foreground">{percent}%</span>
								</div>
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
									<div
										class="h-full bg-primary transition-all duration-300"
										style="width: {percent}%"
									></div>
								</div>
							</Card.Content>

							<Card.Footer class="border-t bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
								Updated {timeAgo(p.lastModified)}
							</Card.Footer>
						</div>
					</Card.Root>
				</li>
			{/each}
		</ul>
	{:else if search.trim()}
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
		>
			<p class="text-sm text-muted-foreground">
				No projects matching "<span class="font-medium text-foreground">{search}</span>"
			</p>
			<Button variant="link" size="sm" class="mt-1 text-xs" onclick={() => (search = '')}>
				Clear search filters
			</Button>
		</div>
	{:else}
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
		>
			<div class="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
				<FolderKanban class="size-5 text-muted-foreground" />
			</div>
			<h3 class="text-sm font-semibold">No projects created</h3>
			<p class="mt-1 mb-4 max-w-xs text-xs text-muted-foreground">
				Get started by creating your first local project workspace.
			</p>
			<Button onclick={openCreate} size="sm" class="h-9 px-3 text-xs">
				<Plus class="mr-1.5 size-4" /> Create project
			</Button>
		</div>
	{/if}
</div>

<!-- Project Create/Edit Modal Dialog -->
<Dialog.Root bind:open={formOpen}>
	<Dialog.Content class="sm:max-w-md">
		<form
			class="space-y-4"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<Dialog.Header>
				<Dialog.Title>{editingId === null ? 'Create project' : 'Edit project'}</Dialog.Title>
			</Dialog.Header>

			<div class="space-y-3">
				<div class="grid gap-1.5">
					<Label for="project-name" class="text-xs">Name</Label>
					<Input
						id="project-name"
						bind:value={name}
						placeholder="e.g., Mobile App Launch"
						required
					/>
				</div>

				<div class="grid gap-1.5">
					<Label for="project-desc" class="text-xs">Description</Label>
					<Textarea
						id="project-desc"
						bind:value={description}
						rows={3}
						placeholder="Brief summary of goals or key targets..."
					/>
				</div>
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0">
				<Button type="button" variant="outline" onclick={() => (formOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={!name.trim()}>
					{editingId === null ? 'Create' : 'Save changes'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Project Delete Alert Dialog -->
<AlertDialog.Root
	open={toDelete !== null}
	onOpenChange={(open) => {
		if (!open) toDelete = null;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete "{toDelete?.name}"?</AlertDialog.Title>
			<AlertDialog.Description class="text-xs">
				This will permanently remove this project along with all associated tasks from local
				database.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
				onclick={confirmDelete}
			>
				Delete project
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
