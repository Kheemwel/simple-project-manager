<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<title>Simple Project Manager</title>
	<meta
		name="description"
		content="Fast, lightweight, local-first project and task manager powered by Dexie IndexedDB."
	/>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Handles seamless switching between light and dark modes -->
<ModeWatcher />

<main class="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
	{@render children()}
</main>
