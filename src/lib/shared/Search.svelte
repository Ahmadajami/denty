<script module lang="ts">
	import Loader from '@lucide/svelte/icons/loader';
</script>

<script lang="ts">
	import PatientAvatar from './PatientAvatar.svelte';
	import type { Snippet } from 'svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import type { E164Number } from 'svelte-tel-input/types';

	import type { Patient } from '$lib/server/db/generated/prisma/client';

	const DEBOUNCETIME = 900;

	let needSearchFor = $state('');
	let controller: AbortController | null = null;
	let valid = $state(true);

	let {
		onNoPatient,
		row,
		query = $bindable<E164Number>('')
	}: {
		onNoPatient: () => void;
		row?: Snippet<[Patient]>;
		query?: string;
	} = $props();

	$effect(() => {
		const trimmed = query.trim();
		const id = setTimeout(() => (needSearchFor = trimmed), DEBOUNCETIME);
		return () => clearTimeout(id);
	});

	async function searchPatients(searchQuery: string): Promise<Patient[]> {
		if (!searchQuery) return [];

		if (controller) controller.abort();
		controller = new AbortController();
		const signal = controller.signal;

		try {
			const res = await fetch(`/dashboard/api/search.json?q=${encodeURIComponent(searchQuery)}`, {
				signal
			});
			if (!res.ok) throw new Error(`Search failed: ${res.status}`);
			return (await res.json()) as Patient[];
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return [];
			throw error;
		}
	}

	function handleNoPatient() {
		onNoPatient();
	}
</script>

<div class="flex flex-col gap-2">
	<!-- Phone input -->
	<PhoneInput bind:valid bind:value={query} />

	<!-- Search results -->
	<ScrollArea class="mt-3 h-[220px]" data-lenis-prevent>
		<ul class="relative h-full space-y-3 divide-y-2">
			{#if needSearchFor}
				{#await searchPatients(needSearchFor)}
					<!-- Loading state -->
					<li class="absolute inset-0 flex items-center justify-center">
						<Loader class="animate-spin text-muted-foreground" size={24} />
					</li>
				{:then list}
					{#if list.length === 0}
						<!-- No results -->
						<li class="px-4 py-10 text-center text-sm text-muted-foreground">
							Nothing Found.
							<Button onclick={handleNoPatient} variant="link" class="cursor-pointer p-1 underline">
								New Patient
							</Button>
						</li>
					{:else}
						<!-- Render results -->
						{#each list as p}
							{#if row}
								<li class="my-2">
									{@render row(p)}
								</li>
							{:else}
								<li class="flex items-center gap-4 px-4 py-3">
									<PatientAvatar {p} />
								</li>
							{/if}
						{/each}
					{/if}
				{:catch err}
					<li class="px-4 py-10 text-center text-sm text-destructive">
						{err?.message || 'An error occurred'}
					</li>
				{/await}
			{:else if !query}
				<li class="px-4 py-10 text-center text-sm text-muted-foreground">
					Start typing to search for patients
				</li>
			{/if}
		</ul>
	</ScrollArea>
</div>
