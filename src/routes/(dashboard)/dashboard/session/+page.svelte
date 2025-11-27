<script lang="ts" module>
	import Loader from '@lucide/svelte/icons/loader';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import User from '@lucide/svelte/icons/user';
	import Phone from '@lucide/svelte/icons/phone';
	import Calendar from '@lucide/svelte/icons/calendar';
	import FileText from '@lucide/svelte/icons/file-text';
	import BadgeInfo from '@lucide/svelte/icons/badge-info';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	type Treatment = {
		id: string;
		name: string;
		nameAr: string | null;
		groupId: string;
		basePrice: number | null;
	};

	type TreatmentGroup = {
		id: string;
		name: string;
		nameAr: string | null;
		color: string;
	};

	type TreatmentSelection = {
		toothNumber: number;
		treatmentId: string;
	};

	type TreatmentRegistryItem = {
		treatment: Treatment;
		group: TreatmentGroup;
	};
</script>

<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { normalizeTelInput, parsePhoneNumberWithError } from 'svelte-tel-input';
	import type { E164Number } from 'svelte-tel-input/types';

	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import SuperDebug from 'sveltekit-superforms';

	import AddPatient from '$lib/shared/AddPatient.svelte';
	import Themetoggle from '$lib/components/layout/Themetoggle.svelte';
	import Stepper from '$lib/pages/session/components/Stepper.svelte';
	import PatientInfo from '$lib/pages/session/components/PatientInfo.svelte';
	import Tooth from '$lib/shared/tooth/Tooth.svelte';

	import { getLocale } from '$lib/paraglide/runtime';
	import { reportLastStep, reportStep0, reportStep1 } from '$lib/zod/session/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const STEPS = [zod4(reportStep0), zod4(reportStep1), zod4(reportLastStep)];

	
const form = superForm(data.form, {
    dataType: 'json',
    taintedMessage: true,
    
    onSubmit: async ({ cancel }) => {
        if (currentStep === STEPS.length) return;
        cancel();
        const result = await form.validateForm({ update: true });
        if (result.valid) currentStep++;
    },

    // Add this block here
    async onUpdated({ form }) {
        if (form.valid) {
            currentStep = 1;
        }
    }
});


	const { form: formData, enhance, delayed } = form;

	// --- State ---
	let currentStep = $state(1);
	let addPatientDialog = $state(false);
	let query = $state<E164Number>('');

	// Selection State
	let selectedToothNumber = $state<number | null>(null);
	let treatmentSearch = $state('');
	let expandedGroups = $state<string[]>([]);

	// --- Derived Data (From Server) ---
	const treatmentGroups = $derived(data.treatmentGroups || []);

	const { allTreatments, registry } = $derived.by(() => {
		const mapT = new Map<string, Treatment[]>();
		const mapR = new Map<string, TreatmentRegistryItem>();

		const groups = data.treatmentGroups || [];
		const list = data.treatments || [];

		// Initialize map for all groups to ensure they exist
		for (const g of groups) {
			mapT.set(g.id, []);
		}

		// Populate maps
		for (const t of list) {
			const g = groups.find((x) => x.id === t.groupId);
			if (g) {
				mapT.get(g.id)?.push(t);
				mapR.set(t.id, { treatment: t, group: g });
			}
		}

		return { allTreatments: mapT, registry: mapR };
	});

	// --- Derived UI State ---
	const selections = $derived($formData.toothTreatments as TreatmentSelection[]);

	// Map<ToothNumber, Array<Color>>
	const toothColors = $derived.by(() => {
		const colorMap = new Map<number, string[]>();
		selections.forEach((sel) => {
			if (!sel.treatmentId) return;
			const meta = registry.get(sel.treatmentId);
			if (meta) {
				const existing = colorMap.get(sel.toothNumber) || [];
				existing.push(meta.group.color);
				colorMap.set(sel.toothNumber, existing);
			}
		});
		if (selectedToothNumber && !colorMap.has(selectedToothNumber)) {
			// Default color for selected tooth if no treatments
			colorMap.set(selectedToothNumber, ['#3b82f6']);
		}
		return colorMap;
	});

	// Return all treatments for the currently selected tooth
	const currentToothSelections = $derived.by(() => {
		if (!selectedToothNumber) return [];
		return selections
			.filter((s) => s.toothNumber === selectedToothNumber)
			.map((s) => registry.get(s.treatmentId))
			.filter((item) => item !== undefined) as TreatmentRegistryItem[];
	});

	const filteredGroups = $derived.by(() => {
		if (!treatmentSearch.trim()) return treatmentGroups;
		const term = treatmentSearch.toLowerCase();

		return treatmentGroups.filter((g) => {
			const gName = resolveName(g).toLowerCase();
			if (gName.includes(term)) return true;

			const treatments = allTreatments.get(g.id) ?? [];
			return treatments.some((t) => resolveName(t).toLowerCase().includes(term));
		});
	});

	const reviewData = $derived.by(() => {
		return selections
			.filter((s) => s.treatmentId)
			.map((s) => {
				const meta = registry.get(s.treatmentId);
				return {
					tooth: s.toothNumber,
					treatment: meta ? resolveName(meta.treatment) : 'Unknown',
					group: meta ? resolveName(meta.group) : 'General',
					color: meta?.group.color ?? '#ccc'
				};
			})
			.sort((a, b) => a.tooth - b.tooth);
	});

	// --- Effects ---
	$effect(() => {
		form.options.validators = STEPS[currentStep - 1];
	});

	// Sync phone number from URL if present
	$effect(() => {
		if (data.PhoneNumber) {
			const n = getE164Number('+' + data.PhoneNumber);
			if (n) {
				query = n;
				$formData.phone = query;
			}
		}
	});

	// --- Helpers ---
	function resolveName(item: { name: string; nameAr: string | null }) {
		return getLocale() === 'ar' ? (item.nameAr ?? item.name) : item.name;
	}

	function getE164Number(p: string) {
		try {
			const r = parsePhoneNumberWithError(p);
			return r.isValid() ? normalizeTelInput(r).e164 : null;
		} catch {
			return null;
		}
	}

	function handlePatientSuccess(p: string) {
		const n = getE164Number(p);
		if (n) {
			query = n;
			$formData.phone = query;
			addPatientDialog = false;
			toast.success('Saved');
		} else {
			toast.error('Invalid Number');
		}
	}

	function handleToothToggle(key: string) {
		const n = Number(key);
		selectedToothNumber = selectedToothNumber === n ? null : n;
	}

	function selectTreatment(t: Treatment) {
		if (!selectedToothNumber) return;

		const list = [...($formData.toothTreatments as TreatmentSelection[])];

		// Check if this specific treatment is already on this tooth
		const idx = list.findIndex(
			(item) => item.toothNumber === selectedToothNumber && item.treatmentId === t.id
		);

		if (idx !== -1) {
			// Toggle Off
			list.splice(idx, 1);
			toast.info(`Removed ${resolveName(t)}`);
		} else {
			// Toggle On
			list.push({ toothNumber: selectedToothNumber, treatmentId: t.id });
			toast.success(`Added ${resolveName(t)}`);
		}

		$formData.toothTreatments = list;
	}

	function removeAllTreatmentsForTooth() {
		if (!selectedToothNumber) return;
		$formData.toothTreatments = ($formData.toothTreatments as TreatmentSelection[]).filter(
			(t) => t.toothNumber !== selectedToothNumber
		);
		toast.info(`Cleared Tooth #${selectedToothNumber}`);
	}
</script>

<!-- --- SNIPPETS --- -->

{#snippet treatmentItem(t: Treatment, isSelected: boolean)}
	<button
		type="button"
		onclick={() => selectTreatment(t)}
		class="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm transition-all hover:bg-muted/50 {isSelected
			? 'border-primary bg-primary/5 ring-1 ring-primary'
			: 'border-transparent bg-muted/30'}"
	>
		<span class="font-medium {isSelected ? 'text-primary' : 'text-foreground'}"
			>{resolveName(t)}</span
		>
		{#if isSelected}
			<CheckCircle class="h-4 w-4 text-primary" />
		{/if}
	</button>
{/snippet}

{#snippet stepTwo()}
	<div
		class="flex h-full w-full animate-in flex-col gap-6 p-4 fade-in slide-in-from-bottom-4 md:p-6"
	>
		<div class="grid h-full gap-6 lg:grid-cols-12">
			<!-- Left: Tooth Chart (Sticky) -->
			<div class="lg:col-span-5 xl:col-span-4">
				<Card.Root class="h-min overflow-hidden border-2 lg:sticky lg:top-4">
					<Card.Header class=" pb-3">
						<div class="flex items-center justify-between">
							<Card.Title class="text-lg">Dental Chart</Card.Title>
							<div class="flex items-center gap-2 text-xs text-muted-foreground">
								<BadgeInfo class="h-3.5 w-3.5" />
								<span>Select a tooth</span>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="flex flex-1 items-center justify-center overflow-y-auto p-2 py-6">
						<div class="scale-90 transition-transform md:scale-100">
							<Tooth
								markedTeeth={toothColors}
								onSelect={({ key }) => handleToothToggle(key)}
								height={400}
								width={280}
							/>
						</div>
					</Card.Content>
					<Card.Footer
						class="justify-center border-t bg-muted/10 p-3 text-xs text-muted-foreground"
					>
						<div class="flex flex-wrap justify-center gap-3">
							{#each treatmentGroups.slice(0, 5) as group}
								<div class="flex items-center gap-1.5">
									<div
										class="h-2.5 w-2.5 rounded-full"
										style="background-color: {group.color}"
									></div>
									<span>{resolveName(group)}</span>
								</div>
							{/each}
						</div>
					</Card.Footer>
				</Card.Root>
			</div>

			<!-- Right: Interaction Panel -->
			<div class="flex h-full flex-col gap-4 overflow-hidden lg:col-span-7 xl:col-span-8">
				<!-- Tooth Context Header -->
				<Card.Root
					class="shrink-0 border-2 border-primary/10 bg-primary/5 shadow-sm transition-all"
				>
					<Card.Content class="flex items-center justify-between p-4">
						<div class="flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background text-lg font-bold text-primary shadow-sm"
							>
								{#if selectedToothNumber}
									{selectedToothNumber}
								{:else}
									?
								{/if}
							</div>
							<div class="flex flex-col">
								{#if selectedToothNumber}
									<span class="text-lg font-bold">Tooth #{selectedToothNumber}</span>
									{#if currentToothSelections.length > 0}
										<div class="mt-1 flex flex-wrap gap-1.5">
											{#each currentToothSelections as selection}
												<Badge variant="secondary" class="gap-1 text-xs font-normal">
													<div
														class="h-1.5 w-1.5 rounded-full"
														style="background-color: {selection.group.color}"
													></div>
													{resolveName(selection.treatment)}
												</Badge>
											{/each}
										</div>
									{:else}
										<span class="text-sm text-muted-foreground">No treatments assigned</span>
									{/if}
								{:else}
									<span class="font-bold text-foreground">No Tooth Selected</span>
									<span class="text-sm text-muted-foreground">Click on the diagram to begin</span>
								{/if}
							</div>
						</div>

						{#if selectedToothNumber && currentToothSelections.length > 0}
							<Button
								variant="destructive"
								size="sm"
								onclick={removeAllTreatmentsForTooth}
								class="gap-2"
							>
								<Trash2 class="h-4 w-4" />
								<span class="hidden sm:inline">Clear All</span>
							</Button>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Treatment Selection List -->
				<Card.Root class="flex flex-1 flex-col overflow-hidden shadow-md">
					<Card.Header class="border-b px-4 py-3">
						<div class="relative">
							<SearchIcon class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search treatments..."
								bind:value={treatmentSearch}
								class="pl-9"
								disabled={!selectedToothNumber}
							/>
						</div>
					</Card.Header>

					<ScrollArea class="flex-1 bg-muted/5">
						<div class="flex flex-col gap-2 p-4">
							{#if !selectedToothNumber}
								<div
									class="flex h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground opacity-60"
								>
									<BadgeInfo class="h-10 w-10" />
									<p>Select a tooth from the chart to view available treatments</p>
								</div>
							{:else if filteredGroups.length === 0}
								<div class="flex h-40 flex-col items-center justify-center text-muted-foreground">
									<p>No treatments found matching "{treatmentSearch}"</p>
								</div>
							{:else}
								<Accordion.Root
									dir={getLocale() === 'ar' ? 'rtl' : 'ltr'}
									type="multiple"
									bind:value={expandedGroups}
									class="space-y-3"
								>
									{#each filteredGroups as group (group.id)}
										{@const treatments = allTreatments.get(group.id) ?? []}
										{@const filteredTreatments = treatmentSearch
											? treatments.filter(
													(t) =>
														resolveName(t).toLowerCase().includes(treatmentSearch.toLowerCase()) ||
														resolveName(group).toLowerCase().includes(treatmentSearch.toLowerCase())
												)
											: treatments}

										<!-- Only show group if it has matching treatments -->
										{#if filteredTreatments.length > 0}
											<div
												class="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
											>
												<Accordion.Item value={group.id} class="border-b-0">
													<Accordion.Trigger
														class="px-4 py-3 transition-colors hover:bg-muted/50 hover:no-underline"
													>
														<div class="flex items-center gap-3">
															<div
																class="h-3 w-3 rounded-full shadow-sm"
																style="background-color: {group.color}"
															></div>
															<span class="text-base font-semibold">{resolveName(group)}</span>
															<Badge variant="secondary" class="mr-2 ml-auto"
																>{filteredTreatments.length}</Badge
															>
														</div>
													</Accordion.Trigger>
													<Accordion.Content class="bg-muted/10 px-3 pt-1 pb-3">
														<div class="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
															{#each filteredTreatments as treatment (treatment.id)}
																{@const isSelected = currentToothSelections.some(
																	(sel) => sel.treatment.id === treatment.id
																)}
																{@render treatmentItem(treatment, isSelected)}
															{/each}
														</div>
													</Accordion.Content>
												</Accordion.Item>
											</div>
										{/if}
									{/each}
								</Accordion.Root>
							{/if}
						</div>
					</ScrollArea>

					<Card.Footer class="z-10 flex items-center justify-between border-t bg-background p-4">
						<div class="text-sm text-muted-foreground">
							<strong>{$formData.toothTreatments.length}</strong> treatments recorded
						</div>
						<div class="flex gap-3">
							<Button variant="outline" onclick={() => currentStep--}>Back</Button>
							<Button
								onclick={() => document.forms[0].requestSubmit()}
								disabled={!$formData.toothTreatments.length}
							>
								Review & Submit
							</Button>
						</div>
					</Card.Footer>
				</Card.Root>
			</div>
		</div>
	</div>
{/snippet}

{#snippet stepOne()}
	<section
		class="flex min-h-[60vh] w-full animate-in items-center justify-center p-4 fade-in slide-in-from-bottom-4"
	>
		<PatientInfo
			{form}
			{formData}
			bind:addPatientDialog
			bind:query
			onValue={(v) => {
				query = v;
				$formData.phone = query;
			}}
		>
			{#snippet submit()}
				<Button type="submit" disabled={!$formData.phone} class="w-full">
					Next Step
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
			{/snippet}
		</PatientInfo>
	</section>
{/snippet}

{#snippet stepThree()}
	<section
		class="mx-auto flex h-full w-full max-w-4xl animate-in flex-col justify-center gap-6 p-4 fade-in slide-in-from-bottom-4 md:p-8"
	>
		<Card.Root class="w-full border-t-4 border-t-primary shadow-lg">
			<Card.Header class="border-b pb-6">
				<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
					<div>
						<Card.Title class="text-2xl">Session Summary</Card.Title>
						<Card.Description
							>Review the patient and treatment details before creating the session.</Card.Description
						>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700"
					>
						<FileText class="h-6 w-6" />
					</div>
				</div>
			</Card.Header>

			<Card.Content class="grid gap-8 pt-8 md:grid-cols-2">
				<!-- Patient Section -->
				<div class="space-y-4">
					<h3
						class="flex items-center gap-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase"
					>
						<User class="h-4 w-4" /> Patient Information
					</h3>
					<div class="rounded-xl border bg-muted/20 p-4">
						<div class="flex items-start gap-4">
							<div class="rounded-full bg-white p-2.5 shadow-sm ring-1 ring-gray-100">
								<Phone class="h-5 w-5 text-primary" />
							</div>
							<div class="space-y-1">
								<p class="text-xs font-medium text-muted-foreground">Phone Number</p>
								<p class="text-lg font-bold tracking-tight text-foreground">{$formData.phone}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Treatments Section -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3
							class="flex items-center gap-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase"
						>
							<Calendar class="h-4 w-4" /> Treatment Plan
						</h3>
						<Badge variant="outline">{reviewData.length} Items</Badge>
					</div>

					<ScrollArea class="h-[250px] rounded-xl border bg-background shadow-sm">
						{#if reviewData.length === 0}
							<div
								class="flex h-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground"
							>
								<TriangleAlert class="h-8 w-8 opacity-20" />
								<p>No treatments recorded.</p>
							</div>
						{:else}
							<div class="divide-y">
								{#each reviewData as item (item.tooth)}
									<div
										class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/30"
									>
										<div class="flex items-center gap-3.5">
											<div
												class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20 ring-inset"
											>
												#{item.tooth}
											</div>
											<div class="flex flex-col">
												<span class="text-sm font-medium">{item.treatment}</span>
												<span class="text-[11px] tracking-wider text-muted-foreground uppercase"
													>{item.group}</span
												>
											</div>
										</div>
										<div
											class="h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-white"
											style="background-color: {item.color}"
											title={item.group}
										></div>
									</div>
								{/each}
							</div>
						{/if}
					</ScrollArea>
				</div>
			</Card.Content>

			<Card.Footer
				class="flex flex-col-reverse gap-3 border-t bg-muted/10 p-6 sm:flex-row sm:justify-between"
			>
				<Button variant="ghost" onclick={() => currentStep--} class="w-full sm:w-auto"
					>Back to Edit</Button
				>
				<Button type="submit" class="w-full min-w-[200px] shadow-md sm:w-auto" size="lg">
					<CheckCircle class="mr-2 h-4 w-4" />
					Confirm Session
				</Button>
			</Card.Footer>
		</Card.Root>
	</section>
{/snippet}

<!-- --- MAIN LAYOUT --- -->

{#if $delayed}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
	>
		<div class="flex flex-col items-center gap-2">
			<Loader class="h-8 w-8 animate-spin text-primary" />
			<p class="text-sm font-medium text-muted-foreground">Processing...</p>
		</div>
	</div>
{/if}

<!-- <SuperDebug data={$formData} /> -->

<AddPatient
	patientForm={data.patientForm}
	bind:addPatientDialog
	phoneNumber={query}
	onSuccess={handlePatientSuccess}
	action="/dashboard"
>
	{#snippet loader()}
		<Loader class="animate-spin" />
	{/snippet}
</AddPatient>

<div class="flex min-h-screen flex-col">
	<!-- Top Navigation -->
	<header class="sticky top-0 z-30 w-full border-b backdrop-blur">
		<div class="container flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-2">
				{#if currentStep > 1}
					<Button
						size="icon"
						variant="ghost"
						onclick={() => currentStep--}
						class="h-8 w-8 rounded-full"
					>
						{#if getLocale() === 'ar'}
							<ArrowRight class="h-4 w-4" />
						{:else}
							<ArrowLeft class="h-4 w-4" />
						{/if}
					</Button>
				{/if}
				<h1 class="text-lg font-bold tracking-tight">New Session</h1>
			</div>

			<div
				class="absolute top-1/2 left-1/2 hidden w-full max-w-md -translate-x-1/2 -translate-y-1/2 md:block"
			>
				<Stepper bind:currIndex={currentStep} totalSteps={STEPS.length} />
			</div>

			<div class="flex items-center gap-2">
				<div class="md:hidden">
					<Badge variant="outline">Step {currentStep}/{STEPS.length}</Badge>
				</div>
				<Themetoggle />
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto max-w-screen-2xl flex-1 p-4 md:p-6 lg:p-8">
		<form method="POST" action="?/new_session" use:enhance class="h-full w-full">
			{#if currentStep === 1}
				{@render stepOne()}
			{:else if currentStep === 2}
				{@render stepTwo()}
			{:else if currentStep === 3}
				{@render stepThree()}
			{/if}
		</form>
	</main>
</div>
