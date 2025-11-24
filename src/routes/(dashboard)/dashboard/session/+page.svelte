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
</script>

<script lang="ts">
	// --- 1. Imports ---
	import * as Card from '$lib/components/ui/card';
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { E164Number } from 'svelte-tel-input/types';
	import type { PageProps } from './$types';
	// NOTE: Imported schemas must align with: Step 0 (Phone), Step 1 (Treatments), Last (Review)
	import { reportLastStep, reportStep0, reportStep1, reviewStep } from '$lib/zod/session';
	import AddPatient from '$lib/shared/AddPatient.svelte';
	import { toast } from 'svelte-sonner';
	import { normalizeTelInput, parsePhoneNumberWithError } from 'svelte-tel-input';
	import { getLocale } from '$lib/paraglide/runtime';
	import Themetoggle from '$lib/components/layout/Themetoggle.svelte';
	import Stepper from '$lib/pages/session/components/Stepper.svelte';
	import PatientInfo from '$lib/pages/session/components/PatientInfo.svelte';
	import Tooth from '$lib/shared/tooth/Tooth.svelte';
	import * as Select from '$lib/components/ui/select';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { onMount } from 'svelte';

	// --- 2. Type Definitions ---
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

	// --- 3. Runes State & Props ---
	let { data }: PageProps = $props();

	const form = superForm(data.form, {
		dataType: 'json',
		taintedMessage: true,
		onSubmit: async ({ cancel }) => {
			// Only submit to server if we are on the last step
			if (isLastStep) return;

			cancel();
			const result = await form.validateForm({ update: true });

			if (result.valid) {
				currentStep++;
			}
		}
	});

	const { form: formData, enhance, delayed, errors } = form;

	// Define 3 steps: 1. Patient (Phone), 2. Treatments, 3. Review
	// Step 0 (Phone) -> Step 1 (Treatments + Phone) -> Review (Final Check)
	const STEPS = [zod4(reportStep0), zod4(reportStep1), zod4(reportLastStep)];
	let currentStep = $state(1);
	let query = $state<E164Number>('');
	let addPatientDialog = $state(false);

	// Data State
	let treatmentGroups = $state<TreatmentGroup[]>([]);
	let allTreatments = $state<Map<string, Treatment[]>>(new Map());
	let allGroupsMap = $state<Map<string, TreatmentGroup>>(new Map());
	let treatmentGroupsLoading = $state(true);
	let selectedToothNumber = $state<number | null>(null);

	// --- 4. Derived Logic ---

	const isLastStep = $derived(currentStep === STEPS.length);

	const toothColors = $derived.by(() => {
		const colors = new Map<number, string>();

		($formData.toothTreatments as TreatmentSelection[]).forEach((selection) => {
			if (selection.treatmentId) {
				let treatmentGroupId: string | undefined;
				for (const [groupId, treatments] of allTreatments.entries()) {
					if (treatments.some((t) => t.id === selection.treatmentId)) {
						treatmentGroupId = groupId;
						break;
					}
				}
				if (treatmentGroupId) {
					const group = allGroupsMap.get(treatmentGroupId);
					if (group) {
						colors.set(selection.toothNumber, group.color);
					}
				}
			}
		});

		if (selectedToothNumber && !colors.has(selectedToothNumber)) {
			colors.set(selectedToothNumber, '#3b82f6');
		}

		return colors;
	});

	// Derived: Status of current selection
	const currentToothStatus = $derived.by(() => {
		if (!selectedToothNumber) return 'none';

		const selection = ($formData.toothTreatments as TreatmentSelection[]).find(
			(t) => t.toothNumber === selectedToothNumber
		);

		if (selection && selection.treatmentId) {
			let tName = 'Treatment Selected';
			for (const treatments of allTreatments.values()) {
				const found = treatments.find((t) => t.id === selection.treatmentId);
				if (found) {
					tName = getLocale() === 'ar' ? (found.nameAr ?? found.name) : found.name;
					break;
				}
			}
			return { status: 'complete', name: tName };
		}

		return { status: 'pending', name: '' };
	});

	// Derived: Prepare data for Review Step
	const reviewData = $derived.by(() => {
		const items: Array<{ tooth: number; treatment: string; group: string; color: string }> = [];
		($formData.toothTreatments as TreatmentSelection[]).forEach((item) => {
			if (!item.treatmentId) return;

			// Find details
			let tName = 'Unknown';
			let gName = 'General';
			let color = '#ccc';

			for (const [groupId, treatments] of allTreatments.entries()) {
				const found = treatments.find((t) => t.id === item.treatmentId);
				if (found) {
					tName = getLocale() === 'ar' ? (found.nameAr ?? found.name) : found.name;
					const grp = allGroupsMap.get(groupId);
					if (grp) {
						gName = getLocale() === 'ar' ? (grp.nameAr ?? grp.name) : grp.name;
						color = grp.color;
					}
					break;
				}
			}
			items.push({ tooth: item.toothNumber, treatment: tName, group: gName, color });
		});
		return items.sort((a, b) => a.tooth - b.tooth);
	});

	$effect(() => {
		form.options.validators = STEPS[currentStep - 1];
	});

	$effect(() => {
		if (data.PhoneNumber) {
			try {
				const p = '+' + data.PhoneNumber;
				const t = getE164Number(p);
				if (t) {
					query = t;
					$formData.phone = query;
				}
			} catch (err) {
				console.error('Invalid phone number:', err);
			}
		}
	});

	// Toast helper - Adjusted to show only on Treatment Step (Step 2)
	$effect(() => {
		const shouldShow = localStorage.getItem('showToothelp') !== 'false';
		if (currentStep === 2 && shouldShow) {
			toast('Treatment Selection', {
				description:
					'Select a treatment, then click a tooth to apply it. Click the same tooth again to edit.',
				action: {
					label: `Don't show again`,
					onClick: () => localStorage.setItem('showToothelp', 'false')
				},
				position: 'bottom-center',
				duration: 9000
			});
		}
	});

	// --- 6. Helpers ---
	function getE164Number(phoneNumber: string): string | null {
		try {
			const parsedNumber = parsePhoneNumberWithError(phoneNumber);
			if (parsedNumber.isValid()) {
				return normalizeTelInput(parsedNumber).e164;
			}
			return null;
		} catch (error) {
			return null;
		}
	}

	function handleonSuccessPatient(phoneNumber: string) {
		try {
			const tt = parsePhoneNumberWithError(phoneNumber);
			if (tt.isValid()) {
				toast.success('Patient created successfully');
				const normalized = normalizeTelInput(tt);
				query = normalized.e164;
				$formData.phone = query;
				addPatientDialog = false;
			}
		} catch (err) {
			toast.error('Invalid phone number');
		}
	}

	// --- 7. Fetching ---
	async function getTreatmentGroupsAndTreatments() {
		treatmentGroupsLoading = true;
		try {
			const groupsRes = await fetch('/dashboard/api/treatment-groups.json');
			const groupsData: TreatmentGroup[] = await groupsRes.json();
			treatmentGroups = groupsData;

			groupsData.forEach((group) => allGroupsMap.set(group.id, group));

			const fetchPromises = groupsData.map(async (group) => {
				const q = encodeURIComponent(group.id);
				const res = await fetch(`/dashboard/api/treatment.json/${q}`);
				const treatments: Treatment[] = await res.json();
				allTreatments.set(group.id, treatments);
			});

			await Promise.all(fetchPromises);
		} catch (error) {
			console.error('Failed data load', error);
			toast.error('Failed to load treatments data.');
		} finally {
			treatmentGroupsLoading = false;
		}
	}

	// --- 8. Handlers ---
	function handleToothSelect(toothKey: string) {
		const toothNumber = Number(toothKey);
		if (selectedToothNumber === toothNumber) {
			selectedToothNumber = null; // Deselect if clicking same
			return;
		}
		selectedToothNumber = toothNumber;
	}

	onMount(() => {
		getTreatmentGroupsAndTreatments();
	});
</script>

{#snippet legendItem(color: string, name: string)}
	<div class="inline-flex items-center space-x-1.5 text-sm font-medium">
		<div
			class="h-3 w-3 rounded-full border border-gray-200"
			style="background-color: {color}"
		></div>
		<span class="text-muted-foreground">{name}</span>
	</div>
{/snippet}

{#if $delayed}
	<div class="flex min-h-svh min-w-screen items-center justify-center">
		<Loader class="animate-spin" />
	</div>
{/if}

<SuperDebug data={$formData} />
{JSON.stringify(errors)}
<AddPatient
	patientForm={data.patientForm}
	bind:addPatientDialog
	phoneNumber={query}
	onSuccess={handleonSuccessPatient}
	action="/dashboard"
>
	{#snippet loader()}
		<Loader class="animate-spin" />
	{/snippet}
</AddPatient>

<!-- Navigation Header -->
<div class="flex w-full items-center justify-between border-b border-gray-200 px-6 py-2 shadow-sm">
	<div class="hidden items-center gap-2 md:flex">
		<Button size="icon" variant="ghost" onclick={() => history.back()} class="h-8 w-8">
			{#if getLocale() === 'ar'}
				<ArrowRight class="h-4 w-4" />
			{:else}
				<ArrowLeft class="h-4 w-4" />
			{/if}
		</Button>
		<h1 class="text-lg font-bold">New Session</h1>
	</div>

	<div class="flex flex-1 justify-center self-center">
		<Stepper bind:currIndex={currentStep} totalSteps={STEPS.length} />
	</div>
	<div class="hidden w-[180px] md:block">
		<Themetoggle />
	</div>
</div>

<form method="POST" action="?/new_session" use:enhance class=" w-full">
	<!-- STEP 1: Patient Info -->
	{#if currentStep === 1}
		<section
			class="flex h-full w-full animate-in items-center justify-center p-4 fade-in slide-in-from-bottom-4"
		>
			<PatientInfo
				{form}
				{formData}
				bind:addPatientDialog
				bind:query
				onValue={(value) => {
					query = value;
					$formData.phone = query;
				}}
			>
				{#snippet submit()}
					<Button type="submit" disabled={!$formData.phone} class="w-full">Next</Button>
				{/snippet}
			</PatientInfo>
		</section>

		<!-- STEP 2: Tooth Chart & Treatments -->
	{:else if currentStep === 2}
		<div
			class="flex h-full animate-in flex-col gap-4 p-4 duration-300 ease-in-out fade-in slide-in-from-bottom-4 md:p-8"
		>
			<Card.Root class="w-full shrink-0">
				<Card.Content class="py-4">
					{#if treatmentGroupsLoading}
						<div class="flex w-full justify-center">
							<Loader class="h-4 w-4 animate-spin text-muted-foreground" />
						</div>
					{:else}
						<div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
							{#each treatmentGroups as group (group.id)}
								{@const groupName = getLocale() === 'ar' ? group.nameAr : group.name}
								{@render legendItem(group.color, groupName ?? '')}
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<section class="flex flex-1 flex-col gap-6 lg:flex-row">
				<Card.Root class="flex min-h-[500px] basis-full items-center justify-center lg:basis-[40%]">
					<Tooth markedTeeth={toothColors} onSelect={({ key }) => handleToothSelect(key)} />
				</Card.Root>

				<Card.Root class="basis-full lg:basis-[60%]">
					<Card.Header>
						<div class="flex items-center justify-between">
							<Card.Title>Treatment Details</Card.Title>
							{#if currentToothStatus !== 'none' && currentToothStatus.status === 'complete'}
								<Button
									variant="destructive"
									size="sm"
									class="h-7 text-xs"
									onclick={() => {
										if (selectedToothNumber) {
											$formData.toothTreatments = $formData.toothTreatments.filter(
												(t) => t.toothNumber !== selectedToothNumber
											);
										}
									}}
								>
									Clear Treatment
								</Button>
							{/if}
						</div>
						<Card.Description>
							{#if selectedToothNumber}
								Editing Tooth <span class="font-bold text-primary">#{selectedToothNumber}</span>
							{:else}
								Select a tooth from the chart to begin.
							{/if}
						</Card.Description>
					</Card.Header>

					<Card.Content class="flex flex-col gap-4">
						{#if currentToothStatus === 'none'}
							<div
								class="flex items-center gap-3 rounded-md border border-muted bg-muted/50 p-4 text-muted-foreground"
							>
								<ArrowLeft class="h-5 w-5" />
								<p class="text-sm">Click on a tooth in the diagram to assign a treatment.</p>
							</div>
						{:else if currentToothStatus.status === 'pending'}
							<div
								class="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
							>
								<TriangleAlert class="h-5 w-5 shrink-0" />
								<div class="flex flex-col">
									<p class="text-sm font-semibold">Action Required</p>
									<p class="text-sm">
										Please select a treatment type below for Tooth #{selectedToothNumber}.
									</p>
								</div>
							</div>
						{:else}
							<div
								class="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
							>
								<CheckCircle class="h-5 w-5 shrink-0" />
								<div class="flex flex-col">
									<p class="text-sm font-semibold">Ready</p>
									<p class="text-sm">
										Tooth #{selectedToothNumber} set to: <strong>{currentToothStatus.name}</strong>
									</p>
								</div>
							</div>
						{/if}

						<div class="my-2 h-px w-full bg-border"></div>

						<ScrollArea class="h-[350px] pr-4">
							{#if treatmentGroupsLoading}
								<div class="flex h-full items-center justify-center">
									<Loader class="animate-spin" />
								</div>
							{:else if treatmentGroups.length > 0}
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									{#each treatmentGroups as group (group.id)}
										{@const treatments = allTreatments.get(group.id) ?? []}
										{@const groupName = getLocale() === 'ar' ? group.nameAr : group.name}

										{@const currentTreatment = (
											$formData.toothTreatments as TreatmentSelection[]
										).find((t) => t.toothNumber === selectedToothNumber)}

										<div class="flex flex-col gap-1.5">
											<span class="ml-1 text-xs font-medium text-muted-foreground">{groupName}</span
											>
											<Select.Root
												type="single"
												name={`treatment-group-${group.id}`}
												disabled={!selectedToothNumber}
												value={($formData.toothTreatments as TreatmentSelection[]).find(
													(t) => t.toothNumber === selectedToothNumber
												)?.treatmentId ?? ''}
												onValueChange={(newTreatmentId) => {
													if (selectedToothNumber && newTreatmentId) {
														const idx = (
															$formData.toothTreatments as TreatmentSelection[]
														).findIndex((t) => t.toothNumber === selectedToothNumber);

														if (idx !== -1) {
															// Update existing
															$formData.toothTreatments = (
																$formData.toothTreatments as TreatmentSelection[]
															).map((item, index) => {
																if (index === idx) {
																	return { ...item, treatmentId: newTreatmentId };
																}
																return item;
															});
														} else {
															// Create new
															$formData.toothTreatments = [
																...($formData.toothTreatments as TreatmentSelection[]),
																{ toothNumber: selectedToothNumber, treatmentId: newTreatmentId }
															];
														}
													}
												}}
											>
												<Select.Trigger class="w-full">
													{groupName}
												</Select.Trigger>
												<Select.Content>
													<Select.Group>
														<Select.Label>{groupName}</Select.Label>
														{#each treatments as treatment (treatment.id)}
															{@const treatmentLabel =
																getLocale() === 'ar' ? treatment.nameAr : treatment.name}
															<Select.Item value={treatment.id} label={treatmentLabel ?? ''}>
																{treatmentLabel}
															</Select.Item>
														{/each}
													</Select.Group>
												</Select.Content>
											</Select.Root>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-center text-muted-foreground">No treatment groups found.</p>
							{/if}
						</ScrollArea>
					</Card.Content>

					<Card.Footer>
						<div class="flex w-full justify-between">
							<Button variant="outline" type="button" onclick={() => currentStep--}>Back</Button>
							<div class="flex items-center gap-4">
								<div class="hidden self-center text-xs text-muted-foreground sm:block">
									{$formData.toothTreatments.length} teeth recorded
								</div>
								<Button type="submit" disabled={!$formData.toothTreatments.length}>Next</Button>
							</div>
						</div>
					</Card.Footer>
				</Card.Root>
			</section>
		</div>

		<!-- STEP 3: Review Step -->
	{:else if currentStep === 3}
		<section
			class="mx-auto flex h-full w-full max-w-3xl animate-in flex-col justify-center gap-6 p-4 fade-in slide-in-from-bottom-4 md:p-8"
		>
			<Card.Root class="w-full shadow-lg">
				<Card.Header class="border-b pb-4">
					<div class="flex items-center justify-between">
						<div>
							<Card.Title class="text-xl">Review Session</Card.Title>
							<Card.Description>Verify details before submitting.</Card.Description>
						</div>
						<FileText class="h-8 w-8 text-muted-foreground opacity-20" />
					</div>
				</Card.Header>

				<Card.Content class="flex flex-col gap-6 pt-6">
					<!-- Patient Details Summary -->
					<div class="flex flex-col gap-3">
						<h3 class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
							<User class="h-4 w-4" /> Patient Information
						</h3>
						<div class="rounded-md border bg-muted/30 p-3">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm"
								>
									<Phone class="h-5 w-5 text-primary" />
								</div>
								<div class="flex flex-col">
									<span class="text-sm font-medium">Phone Number</span>
									<span class="text-lg font-bold tracking-tight">{$formData.phone}</span>
								</div>
							</div>
						</div>
					</div>

					<div class="h-px w-full bg-border"></div>

					<!-- Treatment List Summary -->
					<div class="flex flex-col gap-3">
						<div class="flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
								<Calendar class="h-4 w-4" /> Treatments ({reviewData.length})
							</h3>
						</div>

						<ScrollArea class="h-[220px] rounded-md border bg-background">
							{#if reviewData.length === 0}
								<div
									class="flex h-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground"
								>
									<TriangleAlert class="h-8 w-8 opacity-50" />
									<p>No treatments recorded.</p>
								</div>
							{:else}
								<div class="flex flex-col divide-y">
									{#each reviewData as item (item.tooth)}
										<div
											class="flex items-center justify-between p-3 transition-colors hover:bg-muted/50"
										>
											<div class="flex items-center gap-3">
												<!-- Tooth Badge -->
												<div
													class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20 ring-inset"
												>
													#{item.tooth}
												</div>
												<div class="flex flex-col">
													<span class="font-medium">{item.treatment}</span>
													<span class="text-xs text-muted-foreground">{item.group}</span>
												</div>
											</div>
											<!-- Color Indicator -->
											<div
												class="h-3 w-3 rounded-full shadow-sm"
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

				<Card.Footer class="flex items-center justify-between gap-4 border-t bg-muted/20 p-6">
					<Button variant="outline" onclick={() => currentStep--} class="w-32">Back</Button>
					<Button type="submit" class="w-full min-w-[140px] sm:w-auto">Confirm & Submit</Button>
				</Card.Footer>
			</Card.Root>
		</section>
	{/if}
</form>
