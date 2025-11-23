<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import { type Snippet } from 'svelte';
	import { crudPatientSchema, type CreatePatientFormSchema } from '$lib/zod/patient';

	let {
		patientForm,
		addPatientDialog = $bindable(),
		onSuccess,
		phoneNumber,
		loader,
		action
	}: {
		patientForm: SuperValidated<Infer<CreatePatientFormSchema>>;
		addPatientDialog: boolean;
		phoneNumber?: string;
		action?: string;
		onSuccess: (phoneNumber: string) => void;
		loader: Snippet;
	} = $props();

	const form = superForm(patientForm, {
		validators: zod4Client(crudPatientSchema),
		onUpdated: async ({ form }) => {
			if (form.valid) onSuccess(form.data.phone);
		}
	});

	const {
		form: patientformData,
		enhance: patientformenhance,
		delayed: patientformdelayed,
		errors
	} = form;

	$effect(() => {
		if (phoneNumber) {
			$patientformData.phone = phoneNumber;
		}
	});
</script>

<Dialog.Root bind:open={addPatientDialog}>
	<Dialog.Content class="sm:max-w-[425px]">
		<form {action} method="POST" use:patientformenhance class="mt-6" autocomplete="on">
			<Dialog.Header>
				<Dialog.Title>Create A New Patient</Dialog.Title>
				<Dialog.Description>
					Please fill out the form below to create an Patienet.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<Form.Field {form} name="fullname">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class="font-medium">Fullname</Form.Label>
							<Input
								{...props}
								type="text"
								placeholder="Enter your Patient Fullname"
								bind:value={$patientformData.fullname}
							/>
							<Form.Description class="text-xs text-muted-foreground">
								Patient Fullname in English
							</Form.Description>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<div>
				<Form.Field {form} name="fullnameAr">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label dir="rtl" class="font-medium">الإسم بالكامل</Form.Label>
							<Input
								{...props}
								type="text"
								placeholder="إسم المريض"
								dir="rtl"
								bind:value={$patientformData.fullnameAr}
							/>
							<Form.Description class="text-xs text-muted-foreground">
								إسم المريض بالكامل باللغة العربية
							</Form.Description>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<div>
				<Form.Field {form} name="phone">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Phone number</Form.Label>
							<PhoneInput
								country="SY"
								placeholder="Patient Phone Number"
								bind:value={$patientformData.phone}
								{...props}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description class="text-xs text-muted-foreground"
						>Patient Phone Number</Form.Description
					>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<Dialog.Footer>
				<Button
					type="submit"
					disabled={$patientformdelayed}
					class={[$patientformdelayed ? 'inline-flex transition-all' : '']}
				>
					{#if $patientformdelayed}
						{@render loader()}
					{/if}
					Save changes
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
