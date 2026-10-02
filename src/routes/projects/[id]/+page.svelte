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

	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Trash from '@lucide/svelte/icons/trash';

	import {
		addTask,
		deleteTask,
		projectLive,
		tasks,
		updateTask,
		updateTaskStatus
	} from '$lib/data/services';
	import { STATUS_CONFIG, TASK_STATUSES, type Task, type TaskStatus } from '$lib/data/models';

	let { data } = $props();

	// Reactive project & task stores from Dexie liveQuery
	const projectStore = $derived(projectLive(data.id));
	const tasksStore = $derived(tasks(data.id));

	// ---------- state ----------
	let search = $state('');
	let statusFilter = $state<string>('all');
	let searchEl = $state<HTMLInputElement | null>(null);

	// Task Form Dialog (editingId === null → creating task)
	let taskFormOpen = $state(false);
	let editingTaskId = $state<number | null>(null);
	let taskName = $state('');
	let taskDescription = $state('');
	let taskStatus = $state<TaskStatus>('Not Started');

	// Task Delete Confirmation Dialog
	let taskToDelete = $state<{ id: number; name: string } | null>(null);

	// ---------- derived ----------
	const project = $derived($projectStore);
	const allProjectTasks = $derived($tasksStore ?? []);

	const stats = $derived.by(() => {
		const total = allProjectTasks.length;
		const completed = allProjectTasks.filter((t) => t.status === 'Completed').length;
		const percent = total ? Math.round((completed / total) * 100) : 0;
		return { total, completed, percent };
	});

	const visibleTasks = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return allProjectTasks.filter((t) => {
			const matchesSearch =
				!q || t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q);
			const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	});

	// ---------- actions ----------
	function openCreateTask() {
		editingTaskId = null;
		taskName = '';
		taskDescription = '';
		taskStatus = 'Not Started';
		taskFormOpen = true;
	}

	function openEditTask(t: Task) {
		editingTaskId = t.id;
		taskName = t.name;
		taskDescription = t.description ?? '';
		taskStatus = t.status;
		taskFormOpen = true;
	}

	async function saveTask() {
		if (!taskName.trim()) return;

		if (editingTaskId === null) {
			await addTask({
				projectId: data.id,
				name: taskName.trim(),
				description: taskDescription.trim(),
				status: taskStatus
			});
		} else {
			await updateTask(editingTaskId, {
				name: taskName.trim(),
				description: taskDescription.trim(),
				status: taskStatus
			});
		}

		taskFormOpen = false;
	}

	async function confirmDeleteTask() {
		if (!taskToDelete) return;
		await deleteTask(taskToDelete.id);
		taskToDelete = null;
	}

	async function toggleQuickComplete(t: Task) {
		const nextStatus: TaskStatus = t.status === 'Completed' ? 'Not Started' : 'Completed';
		await updateTaskStatus(t.id, nextStatus);
	}

	function goBack() {
		history.back();
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
	<!-- Top Navigation Bar -->
	<div class="flex items-center justify-between">
		<Button onclick={goBack} variant="ghost">
			<ArrowLeft class="size-4" /> Back to Projects
		</Button>
		<div class="flex items-center gap-2">
			<ThemeSwitcher />
			<Button onclick={openCreateTask} size="sm" class="h-9 px-3 text-xs sm:text-sm">
				<Plus class="mr-1.5 size-4" /> Add Task
			</Button>
		</div>
	</div>

	<!-- Project Header Info & Progress Bar -->
	<header class="rounded-lg border bg-card p-4 shadow-xs sm:p-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div class="space-y-1">
				<h1 class="text-xl font-bold tracking-tight sm:text-2xl">
					{project?.name ?? 'Loading...'}
				</h1>
				<p class="text-xs text-muted-foreground sm:text-sm">
					{project?.description || 'No description provided for this project.'}
				</p>
			</div>

			<!-- Task Statistics pill -->
			<div
				class="flex shrink-0 items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs"
			>
				<ListTodo class="size-4 text-muted-foreground" />
				<span class="font-medium">{stats.completed} / {stats.total} Tasks Done</span>
				<span class="text-muted-foreground">({stats.percent}%)</span>
			</div>
		</div>

		<!-- Compact Progress Bar -->
		<div class="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
			<div
				class="h-full bg-primary transition-all duration-300"
				style="width: {stats.percent}%"
			></div>
		</div>
	</header>

	<!-- Filters Toolbar -->
	<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
		<InputGroup.Root class="w-full sm:max-w-xs">
			<InputGroup.Addon>
				<Search class="size-4 text-muted-foreground" />
			</InputGroup.Addon>
			<InputGroup.Input bind:ref={searchEl} bind:value={search} placeholder="Search tasks..." />
			<InputGroup.Addon align="inline-end">
				<Kbd class="hidden sm:inline-flex">⌘K</Kbd>
			</InputGroup.Addon>
		</InputGroup.Root>

		<div class="flex items-center gap-2 self-end sm:self-auto">
			<Select.Root type="single" bind:value={statusFilter}>
				<Select.Trigger class="h-9 w-40 text-xs">
					<span class="mr-1 text-muted-foreground">Status:</span>
					{statusFilter === 'all' ? 'All Tasks' : statusFilter}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All Tasks">All Tasks</Select.Item>
					{#each TASK_STATUSES as status (status)}
						<Select.Item value={status} label={status}>{status}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- Tasks List -->
	{#if visibleTasks.length > 0}
		<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
			{#each visibleTasks as t (t.id)}
				{@const cfg = STATUS_CONFIG[t.status]}
				<Card.Root
					class="group relative flex flex-col justify-between transition-all hover:border-foreground/20 hover:shadow-xs"
				>
					<Card.Header class="p-3.5 pb-2">
						<div class="flex items-start justify-between gap-2">
							<div class="flex min-w-0 items-start gap-2.5">
								<!-- Quick Complete Button -->
								<button
									type="button"
									onclick={() => toggleQuickComplete(t)}
									class="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
									title={t.status === 'Completed' ? 'Mark as incomplete' : 'Mark as completed'}
								>
									{#if t.status === 'Completed'}
										<CheckCircle2 class="size-4 text-emerald-500" />
									{:else}
										<CircleDot class="size-4" />
									{/if}
								</button>
								<Card.Title
									class="truncate text-sm leading-tight font-semibold {t.status === 'Completed'
										? 'text-muted-foreground line-through'
										: ''}"
								>
									{t.name}
								</Card.Title>
							</div>

							<!-- Task Dropdown Menu -->
							<div class="relative z-10 -mt-1 -mr-1 shrink-0">
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
												<span class="sr-only">Task actions</span>
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item onSelect={() => openEditTask(t)}>
											<SquarePen class="mr-2 size-4" /> Edit
										</DropdownMenu.Item>
										<DropdownMenu.Item
											class="text-destructive focus:text-destructive"
											onSelect={() => (taskToDelete = { id: t.id, name: t.name })}
										>
											<Trash class="mr-2 size-4" /> Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>

						<Card.Description class="mt-1 ml-6 line-clamp-2 text-xs text-muted-foreground">
							{t.description || 'No details provided.'}
						</Card.Description>
					</Card.Header>

					<Card.Footer
						class="mt-1 flex items-center justify-between border-t bg-muted/10 p-3.5 px-3.5 py-2 pt-0"
					>
						<span
							class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium {cfg.badgeClass}"
						>
							<span class="size-1.5 rounded-full {cfg.dotClass}"></span>
							{cfg.label}
						</span>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else if search.trim() || statusFilter !== 'all'}
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
		>
			<p class="text-sm text-muted-foreground">No tasks match your filter criteria.</p>
			<Button
				variant="link"
				size="sm"
				class="mt-1 text-xs"
				onclick={() => {
					search = '';
					statusFilter = 'all';
				}}
			>
				Reset filters
			</Button>
		</div>
	{:else}
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
		>
			<div class="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
				<ListTodo class="size-5 text-muted-foreground" />
			</div>
			<h3 class="text-sm font-semibold">No tasks created</h3>
			<p class="mt-1 mb-4 max-w-xs text-xs text-muted-foreground">
				Get started by creating your first task for this project workspace.
			</p>
			<Button onclick={openCreateTask} size="sm" class="h-9 px-3 text-xs">
				<Plus class="mr-1.5 size-4" /> Add Task
			</Button>
		</div>
	{/if}
</div>

<!-- Task Create/Edit Modal Dialog -->
<Dialog.Root bind:open={taskFormOpen}>
	<Dialog.Content class="sm:max-w-md">
		<form
			class="space-y-4"
			onsubmit={(e) => {
				e.preventDefault();
				saveTask();
			}}
		>
			<Dialog.Header>
				<Dialog.Title>{editingTaskId === null ? 'Create Task' : 'Edit Task'}</Dialog.Title>
			</Dialog.Header>

			<div class="space-y-3">
				<div class="grid gap-1.5">
					<Label for="task-name" class="text-xs">Task Title</Label>
					<Input
						id="task-name"
						bind:value={taskName}
						placeholder="e.g., Design homepage hero section"
						required
					/>
				</div>

				<div class="grid gap-1.5">
					<Label for="task-status" class="text-xs">Status</Label>
					<Select.Root type="single" bind:value={taskStatus}>
						<Select.Trigger id="task-status" class="h-9 text-xs">
							{taskStatus}
						</Select.Trigger>
						<Select.Content>
							{#each TASK_STATUSES as status (status)}
								<Select.Item value={status} label={status}>{status}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-1.5">
					<Label for="task-desc" class="text-xs">Description</Label>
					<Textarea
						id="task-desc"
						bind:value={taskDescription}
						rows={3}
						placeholder="Add extra context or requirements..."
					/>
				</div>
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0">
				<Button type="button" variant="outline" onclick={() => (taskFormOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={!taskName.trim()}>
					{editingTaskId === null ? 'Create Task' : 'Save changes'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Task Confirmation Alert Dialog -->
<AlertDialog.Root
	open={taskToDelete !== null}
	onOpenChange={(open) => {
		if (!open) taskToDelete = null;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete "{taskToDelete?.name}"?</AlertDialog.Title>
			<AlertDialog.Description class="text-xs">
				This will permanently remove this task from your local database.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
				onclick={confirmDeleteTask}
			>
				Delete Task
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
