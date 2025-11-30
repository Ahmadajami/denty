<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { treatmentGroupSchema, treatmentSchema } from '$lib/zod/treatment';
	import type { PageData } from './$types';

	// UI Components
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import * as Table from '$lib/components/ui/table';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Plus, Trash2, LoaderCircle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();

	// Dialog States
	let groupOpen = $state(false);
	let treatmentOpen = $state(false);

	// --- GROUP FORM SETUP ---
	const groupFormObj = superForm(data.groupForm, {
		validators: zod4Client(treatmentGroupSchema),
		id: 'group-form', // Unique ID for multiple forms
		onResult: ({ result }) => {
			if (result.type === 'success') {
				groupOpen = false;
				toast.success('Group created');
			}
		}
	});
	// Destructured delayed as 'groupdelayed'
	const {
		form: groupFormData,
		enhance: groupEnhance,
		delayed: groupdelayed,
		errors
	} = groupFormObj;

	// --- TREATMENT FORM SETUP ---
	const treatmentFormObj = superForm(data.treatmentForm, {
		validators: zod4Client(treatmentSchema),
		id: 'treatment-form',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				treatmentOpen = false;
				toast.success('Treatment added');
			}
		}
	});
	// Destructured delayed as 'treatDelayed'
	const { form: treatFormData, enhance: treatEnhance, delayed: treatDelayed } = treatmentFormObj;

	// Helper to open Treatment Modal with pre-filled Group ID
	function openAddTreatment(groupId: string) {
		$treatFormData.groupId = groupId;
		treatmentOpen = true;
	}
</script>

{#if errors}
	{JSON.stringify(errors, null, 2)}
{/if}
<div class="container mx-auto space-y-8 py-10">
	<!-- HEADER -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Treatments Catalog</h2>
			<p class="text-muted-foreground">Manage treatment groups and prices.</p>
		</div>

		<!-- ADD GROUP BUTTON -->
		<Dialog.Root bind:open={groupOpen}>
			<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
				<Plus class="mr-2 h-4 w-4" /> New Group
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Create Treatment Group</Dialog.Title>
				</Dialog.Header>

				<form method="POST" action="?/createGroup" use:groupEnhance class="space-y-4">
					<Form.Field form={groupFormObj} name="nameEn">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name (English)</Form.Label>
								<Input {...props} bind:value={$groupFormData.nameEn} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={groupFormObj} name="nameAr">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name (Arabic)</Form.Label>
								<Input {...props} bind:value={$groupFormData.nameAr} class="text-right" dir="rtl" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={groupFormObj} name="color">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Label Color</Form.Label>
								<div class="flex gap-2">
									<Input
										{...props}
										type="color"
										class="h-10 w-16 p-1"
										bind:value={$groupFormData.color}
									/>
									<Input disabled value={$groupFormData.color} />
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Dialog.Footer>
						<Button type="submit" disabled={$groupdelayed}>
							{#if $groupdelayed}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
							{/if}
							Create Group
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<!-- GROUPS GRID -->
	<div class="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
		{#each data.groups as group (group.id)}
			<Card.Root class="overflow-hidden border-t-4" style="border-top-color: {group.color}">
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<div>
						<Card.Title class="flex items-center gap-2 text-xl">
							{group.nameEn}
							{#if group.nameAr}
								<span class="text-sm font-normal text-muted-foreground">({group.nameAr})</span>
							{/if}
						</Card.Title>
					</div>
					<form action="?/deleteGroup" method="POST" class="ml-auto">
						<input type="hidden" name="id" value={group.id} />
						<Button
							variant="ghost"
							size="icon"
							type="submit"
							class="text-destructive hover:bg-destructive/10"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</form>
				</Card.Header>

				<Card.Content>
					{#if group.treatments.length === 0}
						<div
							class="rounded-lg border-2 border-dashed py-6 text-center text-sm text-muted-foreground"
						>
							No treatments in this group yet.
						</div>
					{:else}
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Name</Table.Head>
									<Table.Head class="text-right">Price</Table.Head>
									<Table.Head class="w-[50px]"></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each group.treatments as treatment}
									<Table.Row>
										<Table.Cell>
											<div class="font-medium">{treatment.nameEn}</div>
											{#if treatment.nameAr}
												<div class="text-xs text-muted-foreground">{treatment.nameAr}</div>
											{/if}
										</Table.Cell>
										<Table.Cell class="text-right font-mono">
											${treatment.basePrice}
										</Table.Cell>
										<Table.Cell>
											<form action="?/deleteTreatment" method="POST">
												<input type="hidden" name="id" value={treatment.id} />
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8 text-muted-foreground hover:text-destructive"
													type="submit"
												>
													<Trash2 class="h-3 w-3" />
												</Button>
											</form>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{/if}
				</Card.Content>

				<Card.Footer class="justify-center bg-muted/30 p-2">
					<Button
						variant="ghost"
						class="w-full text-primary"
						onclick={() => openAddTreatment(group.id)}
					>
						<Plus class="mr-2 h-4 w-4" /> Add Treatment to {group.nameEn}
					</Button>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</div>

<!-- SHARED ADD TREATMENT DIALOG -->
<!-- We put this outside the loop so we only render one dialog -->
<Dialog.Root bind:open={treatmentOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add Treatment</Dialog.Title>
		</Dialog.Header>

		<form method="POST" action="?/createTreatment" use:treatEnhance class="space-y-4">
			<!-- Hidden Group ID -->
			<input type="hidden" name="groupId" bind:value={$treatFormData.groupId} />

			<Form.Field form={treatmentFormObj} name="nameEn">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Treatment Name (English)</Form.Label>
						<Input {...props} bind:value={$treatFormData.nameEn} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={treatmentFormObj} name="nameAr">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Treatment Name (Arabic)</Form.Label>
						<Input {...props} bind:value={$treatFormData.nameAr} dir="rtl" class="text-right" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={treatmentFormObj} name="basePrice">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Base Price</Form.Label>
						<Input {...props} type="number" step="0.01" bind:value={$treatFormData.basePrice} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Dialog.Footer>
				<Button type="submit" disabled={$treatDelayed}>
					{#if $treatDelayed}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Save Treatment
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
