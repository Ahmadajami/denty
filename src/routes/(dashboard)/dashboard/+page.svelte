<script module lang="ts">
	import User from '@lucide/svelte/icons/user';
	import Send from '@lucide/svelte/icons/send';
	import Clock from '@lucide/svelte/icons/clock';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Loader from '@lucide/svelte/icons/loader';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<script lang="ts">
	import type { PageData } from './$types';

	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index';

	import { toast } from 'svelte-sonner';
	import Search from '$lib/shared/Search.svelte';
	import { normalizeTelInput, parsePhoneNumberWithError } from 'svelte-tel-input';

	import type { E164Number } from 'svelte-tel-input/types';
	import AddPatient from '$lib/shared/AddPatient.svelte';
	import { getLocale } from '$lib/paraglide/runtime';

	let {
		data
	}: {
		data: PageData;
	} = $props();

	let openNewPatientDialog = $state(false);
	let query = $state<E164Number>('');
	let req = $state(false);

	function onNoPatient() {
		openNewPatientDialog = !openNewPatientDialog;
		//$formData.phone = query;
	}
	function handleonSuccessPatient(phoneNumber: string) {
		try {
			const tt = parsePhoneNumberWithError(phoneNumber);
			if (tt.isValid()) {
				toast.success('Patient created successfully');
				const normalized = normalizeTelInput(tt);
				query = normalized.e164;
				req = !req;
				openNewPatientDialog = false;
			}
		} catch (err) {
			toast.error('Invalid phone number');
		}
	}
</script>

<AddPatient
	patientForm={data.patientForm}
	bind:addPatientDialog={openNewPatientDialog}
	phoneNumber={query}
	onSuccess={handleonSuccessPatient}
>
	{#snippet loader()}
		<Loader class="animate-spin" />
	{/snippet}
</AddPatient>
<div class="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
	<!-- Top Row -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Today’s Appointmets -->
		<Card.Root class="animate-in duration-700 slide-in-from-bottom-30 lg:col-span-2">
			<Card.Header class="flex items-center justify-between">
				<Card.Title class="flex items-center gap-2">
					<Calendar size={18} /> Today’s Appointmets
				</Card.Title>
				<Card.Action>
					<Button size="sm">New Appointments</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<ul class="space-y-4">
					<li
						class="flex flex-col gap-3 rounded-xl bg-gray-100 p-4 md:flex-row md:items-center md:justify-between"
					>
						<div class="flex items-center gap-3">
							<User class="text-primary" size={18} />
							<div>
								<p class="font-medium">John Doe</p>
								<p class="text-sm text-muted/95">Tooth Filling</p>
							</div>
						</div>
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<Clock size={16} /> 10:00 AM
						</div>
					</li>
					<li
						class="flex flex-col gap-3 rounded-xl bg-gray-100 p-4 md:flex-row md:items-center md:justify-between"
					>
						<div class="flex items-center gap-3">
							<User class="text-blue-600" size={18} />
							<div>
								<p class="font-medium">Sarah Smith</p>
								<p class="text-sm text-gray-500">Cleaning</p>
							</div>
						</div>
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<Clock size={16} /> 11:30 AM
						</div>
					</li>
				</ul>
			</Card.Content>
		</Card.Root>

		<Card.Root class="animate-in duration-700    slide-in-from-right-30   ">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<SearchIcon size={18} /> Quick Patient Lookup
				</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col">
				{#key req}
					<Search bind:query {onNoPatient}>
						{#snippet row(p)}
							<li class="flex items-center justify-between gap-4 px-4 py-3">
								<p>{getLocale() == 'ar' ? p.fullnameAr : p.fullname}</p>
								<Button variant="outline" size="sm" class="font-semibold">Start session</Button>
							</li>
						{/snippet}
					</Search>
				{/key}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Middle Row: Recent Sessions -->
	<Card.Root class="animate-in transition-all duration-700 slide-in-from-bottom-full ">
		<Card.Header class=" flex items-center justify-between ">
			<Card.Title>Recent Sessions</Card.Title>
			<Button size="sm" variant="ghost">View All</Button>
		</Card.Header>
		<Card.Content class="space-y-3">
			<div class="flex flex-col rounded-xl bg-gray-100 p-4 sm:flex-row sm:justify-between">
				<p><strong>Mary Johnson</strong> - Root Canal</p>
				<span class="mt-1 text-sm text-gray-500 sm:mt-0">Yesterday</span>
			</div>
			<div class="flex flex-col rounded-xl bg-gray-100 p-4 sm:flex-row sm:justify-between">
				<p><strong>David Lee</strong> - Whitening</p>
				<span class="mt-1 text-sm text-gray-500 sm:mt-0">2 days ago</span>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Bottom Row -->
	<div
		class="grid animate-in grid-cols-1 gap-6 transition-all duration-700 ease-in-out slide-in-from-bottom-full md:grid-cols-2"
	>
		<!-- Pending Communications -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Send size={18} /> Pending Communications
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div
					class="flex flex-col gap-2 rounded-xl bg-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<p>Session summary for John Doe</p>
					<Button size="sm" class="w-full sm:w-auto">Send</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- KPI Snapshot -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Snapshot</Card.Title>
			</Card.Header>
			<Card.Content class="grid grid-cols-3 divide-x rounded-xl bg-gray-50 p-4 text-center">
				<div>
					<p class="text-2xl font-bold">5</p>
					<p class="text-sm text-muted">Patients Today</p>
				</div>
				<div>
					<p class="text-2xl font-bold">12</p>
					<p class="text-sm text-muted">Sessions This Week</p>
				</div>
				<div>
					<p class="text-2xl font-bold">8</p>
					<p class="text-sm text-gray-500">Upcoming</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- {#snippet new_dashboard()}
	<div class="mt-0 w-full px-6 md:px-8">
		<div class="mx-auto max-w-7xl">
			<h1 class="text-2xl font-semibold tracking-tight">Patient Management</h1>

			
			<div class="mt-2">
				<Input
					placeholder="Search patients"
					bind:value={query}
					class="h-11 pl-4"
					aria-label="Search patients"
				/>
			</div>

			
			<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
				
				<div class="space-y-4 lg:col-span-2">
					<Card.Root class="shadow-sm">
						<Card.Content class="p-0">
							<ScrollArea class="h-[420px]">
								<ul class="divide-y">
									{#each filtered as p}
										<li class="flex items-center gap-4 px-4 py-3">
											<Avatar.Root class="h-10 w-10">
												<Avatar.Image src={p.avatar} alt={p.name} />
												<Avatar.Fallback>
													{p.name
														.split(' ')
														.map((n) => n[0])
														.join('')}
												</Avatar.Fallback>
											</Avatar.Root>
											<div class="flex-1">
												<div class="leading-none font-medium">{p.name}</div>
												<div class="text-muted-foreground text-sm">Age {p.age}</div>
											</div>
											<Button variant="secondary" size="sm">Open</Button>
										</li>
									{/each}

									{#if filtered.length === 0}
										<li class="text-muted-foreground px-4 py-10 text-center text-sm">
											No patients match "{query}".
										</li>
									{/if}
								</ul>
							</ScrollArea>
						</Card.Content>
					</Card.Root>
				</div>

				
				<div class="space-y-6">
					
					<Card.Root class="shadow-sm">
						<Card.Header class="pb-3">
							<Card.Title>Report</Card.Title>
							<Card.Description>Generate and send report to patients</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div
								class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
							>
								<Plus class="text-primary h-8 w-8" />
							</div>
							<Button class="w-full">Generate</Button>
						</Card.Content>
					</Card.Root>

					
					<Card.Root class="shadow-sm">
						<Card.Header class="pb-3">
							<Card.Title>Reservation</Card.Title>
							<Card.Description>Schedule an appointment with a patient</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div
								class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
							>
								<CalendarDays class="text-primary h-8 w-8" />
							</div>
							<Button class="w-full" onclick={makeReservation}>Reserve</Button>
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet gpt_dash()}
	<div class="mt-0 w-full px-4 md:px-8">
		<div class="mx-auto max-w-7xl">
			
			<h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>

			
			<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
				
				<div class="space-y-4 lg:col-span-2">
					<Card.Root class="shadow-sm">
						<Card.Header>
							<Card.Title>Today's Appointment</Card.Title>
							<Card.Description>Your Today’s Appointment</Card.Description>
						</Card.Header>
						<Card.Content class="p-0">
							<ScrollArea class="h-[420px]">
								<ul class="divide-y">
									{#each filtered as p}
										<li class="flex items-center gap-4 px-4 py-3">
											<Avatar.Root class="h-10 w-10 shrink-0">
												<Avatar.Image src={p.avatar} alt={p.name} />
												<Avatar.Fallback>
													{p.name
														.split(' ')
														.map((n) => n[0])
														.join('')}
												</Avatar.Fallback>
											</Avatar.Root>
											<div class="min-w-0 flex-1">
												<div class="truncate leading-none font-medium">{p.name}</div>
												<div class="text-muted-foreground text-sm">Age {p.age}</div>
											</div>
											<Button variant="success" size="sm">Check</Button>
										</li>
									{/each}

									{#if filtered.length === 0}
										<li class="text-muted-foreground px-4 py-10 text-center text-sm">
											No patients match "{query}".
										</li>
									{/if}
								</ul>
							</ScrollArea>
						</Card.Content>
					</Card.Root>
				</div>

				
				<div class="space-y-6 lg:sticky lg:top-6 lg:self-start">
					
					<Card.Root class="shadow-sm">
						<Card.Header class="pb-3">
							<Card.Title>Report</Card.Title>
							<Card.Description>Generate and send report to patients</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col items-center space-y-4">
							<div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
								<Plus class="text-primary h-8 w-8" />
							</div>
							<Button class="w-full">Generate</Button>
						</Card.Content>
					</Card.Root>

					
					<Card.Root class="shadow-sm">
						<Card.Header class="pb-3">
							<Card.Title>Reservation</Card.Title>
							<Card.Description>Schedule an appointment with a patient</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col items-center space-y-4">
							<div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
								<CalendarDays class="text-primary h-8 w-8" />
							</div>
							<Button class="w-full" onclick={makeReservation}>Reserve</Button>
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		</div>
	</div>
{/snippet} -->
