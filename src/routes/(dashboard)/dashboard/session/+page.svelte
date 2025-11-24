<script lang="ts" module>
	import Loader from '@lucide/svelte/icons/loader';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card/index';
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button/index';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { E164Number } from 'svelte-tel-input/types';
	import type { PageProps } from './$types';
	import { reportLastStep, reportStep0, reportStep1, reviewStep } from '$lib/zod/session';
	import AddPatient from '$lib/shared/AddPatient.svelte';
	import { toast } from 'svelte-sonner';
	import { normalizeTelInput, parsePhoneNumberWithError } from 'svelte-tel-input';
	import { getLocale } from '$lib/paraglide/runtime';
	import Themetoggle from '$lib/components/layout/Themetoggle.svelte';
	import Stepper from '$lib/pages/session/components/Stepper.svelte';
	import PatientInfo from '$lib/pages/session/components/PatientInfo.svelte';
	import Tooth from '$lib/shared/tooth/Tooth.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	const STEPS = [zod4(reportStep0), zod4(reportStep1), zod4(reportLastStep), zod4(reviewStep)];

	let currentStep = $state(1);
	let query = $state<E164Number>('');
	let addPatientDialog = $state(false);

	const isLastStep = $derived(currentStep === STEPS.length);

	const form = superForm(data.form, {
		dataType: 'json',
		taintedMessage: true,
		onSubmit: async ({ cancel }) => {
			if (isLastStep) {
				return;
			}

			cancel();

			const result = await form.validateForm({ update: true });

			if (result.valid) {
				currentStep++;
			}
		},

		onUpdated: async ({ form }) => {
			if (form.valid) {
				currentStep = 1;
				query = '';
			}
		}
	});
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
	function getE164Number(phoneNumber: string): string | null {
		try {
			const parsedNumber = parsePhoneNumberWithError(phoneNumber);

			if (parsedNumber.isValid()) {
				const normalized = normalizeTelInput(parsedNumber);
				return normalized.e164;
			}

			return null;
		} catch (error) {
			return null;
		}
	}

	const { form: formData, enhance, delayed, message } = form;
	(function () {
		if (data.PhoneNumber) {
			try {
				const p = '+' + data.PhoneNumber;
				const t = getE164Number(p);
				query = t ?? '';
				$formData.phone = query;
			} catch (err) {
				console.error('Invalid phone number in data:', err);
			}
		}
	})();
	const toastMessage =
		'This tooth diagram displays all teeth that have received treatment. To record a new procedure, first select the treatment you performed during the session, and then click on the corresponding tooth in the diagram.';
	$effect(() => {
		form.options.validators = STEPS[currentStep - 1];
	});
	$effect(() => {
		const shouldShow = localStorage.getItem('showToothelp') !== 'false';
		if (currentStep === 1) {
			if (shouldShow) {
				toast(toastMessage, {
					action: {
						label: `Don't show again`,
						onClick: () => {
							localStorage.setItem('showToothelp', 'false');
							console.log("Don't show again clicked. Preference saved.");
						}
					},
					position: 'bottom-center',
					duration: 9000
				});
			}
		}
	});
	let LegendColor = $derived(['red', 'green', 'blue']);
	let selectTooth = $state<Number>(0);
	let treatmentGroups = $state<
		{
			id: string;
			name: string;
			nameAr: string | null;
			color: string;
		}[]
	>([]);

	let treatmentGroupsLoading = $state(true);
	function getTreatmentGroups() {
		return fetch('/dashboard/api/treatment-groups.json');
	}
	async function getTreatmentByGroupId(groupId: string) {
		const q = encodeURIComponent(groupId);
		const res = await fetch(`/dashboard/api/treatment.json/${q}`);
		return res.json();
	}
	onMount(() => {
		getTreatmentGroups()
			.then((res) => res.json())
			.then((data) => {
				treatmentGroups = data;
				treatmentGroupsLoading = false;
			});
	});
</script>

{#snippet header(title: string, description: string)}
	<div class="space-y-1 text-center sm:text-left">
		<h2 class="text-3xl font-bold tracking-tight">{title}</h2>
		<p class="text-sm">{description}</p>
	</div>
{/snippet}

{#snippet legendItem(color: string, name: string)}
	<div class="inline-flex items-center space-x-1.5 text-lg font-semibold">
		<div class="h-2 w-2 sm:h-3 sm:w-3" style="background-color: {color}"></div>
		<span class=" italic">{name}</span>
	</div>
{/snippet}
{#if $delayed}
	<div class="flex min-h-svh min-w-screen items-center justify-center">
		<Loader class="animate-spin" />
	</div>
{/if}
<SuperDebug data={$formData} />
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
<div class="flex w-full items-center justify-between border-b border-gray-200 px-6 py-1 shadow-sm">
	<!-- Left: Page Title -->
	<h1 class="hidden space-x-2.5 text-2xl font-bold md:block">
		<Button
			size="icon"
			onclick={() => history.back()}
			class=" cursor-pointer items-center bg-transparent text-sm  shadow-2xl transition-all hover:scale-125 hover:scale-3d   "
		>
			{#if getLocale() == 'ar'}
				<ArrowRight
					class="mr-1 h-4 w-4 text-black transition-all hover:scale-125 hover:scale-3d dark:text-white"
				/>
			{:else}
				<ArrowLeft
					class="mr-1 h-4 w-4 text-black transition-all hover:scale-125 hover:scale-3d dark:text-white"
				/>
			{/if}
		</Button><span>Enter Your Session Details</span>
	</h1>

	<!-- Center: Stepper -->
	<div class="flex flex-1 justify-center self-center">
		<Stepper bind:currIndex={currentStep} totalSteps={STEPS.length} />
	</div>

	<!-- Right: Empty spacer (for symmetry / future actions) -->
	<div class="hidden w-[180px] md:block"><Themetoggle /></div>
</div>
<form method="POST" action="?/new_session" use:enhance>
	{#if currentStep === 2}
		<section
			class="flex min-h-screen w-full animate-in items-center justify-center px-4 py-16 fade-in slide-in-from-bottom-4"
		>
			<PatientInfo
				{form}
				{formData}
				bind:addPatientDialog
				bind:query={() => query, (phone) => (query = getE164Number(phone) ?? phone)}
				onValue={(value) => {
					query = value;
					$formData.phone = query;
				}}
			>
				{#snippet submit()}
					<Button type="submit" disabled={!$formData.phone}>Next</Button>
				{/snippet}
			</PatientInfo>
		</section>
	{:else if currentStep === 1}
		<!-- Step 2: Tooth & Diagnoses -->
		<div class="animate-in duration-300 ease-in-out fade-in slide-in-from-bottom-4">
			<Card.Root class="min-w-full">
				<Card.Content class="p-8">
					{#if treatmentGroupsLoading}
						<div class="flex h-full w-full items-center justify-center">
							<Loader class="animate-spin" />
						</div>
					{:else}
						<div class="flex flex-wrap gap-8">
							{#each treatmentGroups as group}
								{@const groupName = getLocale() === 'ar' ? group.nameAr : group.name}
								{@render legendItem(group.color, groupName ?? '')}
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
			<section class="flex flex-col gap-8 p-8 md:flex-row">
				<Card.Root class=" flex w-full basis-[40%] items-center justify-center">
					<Tooth
						fillColor="red"
						onSelect={(tooth, newState) => {
							$formData.toothTreatments[0] = {
								toothNumber: Number(tooth.key),
								treatmentId: ''
							};
						}}
					/>
				</Card.Root>

				<Card.Root class="basis-[60%]">
					<Card.Header>
						<Card.Title>Treatments Section for Tooth</Card.Title>
						<Card.Description>Here are the Treatments Section</Card.Description>
					</Card.Header>

					<Card.Content>
						<ScrollArea class="h-[400px]" data-lenis-prvent>
							{#if treatmentGroupsLoading}
								<div class="flex h-full w-full items-center justify-center">
									<Loader class="animate-spin" />
								</div>
							{:else}
								<div class="flex flex-wrap gap-8">
									{#if treatmentGroups.length > 0}
										{#each treatmentGroups as group}
											{#await getTreatmentByGroupId(group.id) then treatments}
												<Select.Root type="single" name={group.name}>
													<Select.Trigger class="w-72">
														<p class="inline-flex w-full items-center gap-2">
															<ArrowLeft />
															<span>{group.name}</span>
														</p>
													</Select.Trigger>
													<Select.Content>
														<Select.Group>
															<Select.Label>Fruits</Select.Label>
															{#each treatments as treatment (treatment.id)}
																<Select.Item value={treatment.id} label={treatment.name}>
																	{treatment.name}
																</Select.Item>
															{/each}
														</Select.Group>
													</Select.Content>
												</Select.Root>
											{/await}
										{/each}
									{:else}
										no grup lengt
									{/if}
								</div>
							{/if}
						</ScrollArea>
					</Card.Content>
				</Card.Root>
			</section>
		</div>
	{/if}
</form>
<!-- <Select.Root type="single" name={group.name}>
												<Select.Trigger class="w-[180px]">trigger</Select.Trigger>
												<Select.Content>
													<Select.Group>
														<Select.Label>Fruits</Select.Label>
														{#each treatments as treatment (treatment.id)}
															<Select.Item value={treatment.id} label={treatment.name}>
																{treatment.name}
															</Select.Item>
														{/each}
													</Select.Group>
												</Select.Content>
											</Select.Root> -->
