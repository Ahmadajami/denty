<script lang="ts">
	/// UI
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';
	import { medicalSchema, type MedicalSchema, SPECIALIZATION_TYPES } from '$lib/auth';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { Trash } from '@lucide/svelte';
	import Password from '$lib/components/auth/Password.svelte';

	let { form }: { form: SuperValidated<Infer<MedicalSchema>> } = $props();

	const medicalFormObj = superForm(form, {
		resetForm: true,
		validators: zod4Client(medicalSchema),
		dataType: 'json'
	});
	const {
		form: medicalForm,
		enhance: medicalEnhance,
		submitting: medicalSubmitting
	} = medicalFormObj;

	function addDoctor() {
		$medicalForm.doctors = [
			...$medicalForm.doctors,
			{
				name_ar: '',
				name: '',
				phone: '',
				specialization: 'Empty',
				password: '',
				password_confirmation: ''
			}
		];
	}

	function removeDoctorByIndex(index: number) {
		$medicalForm.doctors = $medicalForm.doctors.filter((_, i) => i !== index);
	}
</script>

<form
	method="POST"
	action="?/medicalAccount"
	use:medicalEnhance
	class="space-y-4"
	autocomplete="on"
>
	<!-- Name -->
	<Form.Field form={medicalFormObj} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="block text-lg font-semibold text-gray-800">Name</Form.Label>
				<Input
					type="text"
					bind:value={$medicalForm.name}
					class="mt-1 w-full rounded-lg  "
					{...props}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Name -->
	<Form.Field form={medicalFormObj} name="name_ar">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="block text-lg font-semibold text-gray-800">Arabic Name</Form.Label>
				<Input
					type="text"
					dir="rtl"
					bind:value={$medicalForm.name_ar}
					class="mt-1 w-full rounded-lg border-gray-300 shadow-sm"
					{...props}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<!-- Center Name -->
	<Form.Field form={medicalFormObj} name="center_name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="block text-lg font-semibold text-gray-800">Center Name</Form.Label>
				<Input
					type="text"
					bind:value={$medicalForm.center_name}
					class="mt-1 w-full rounded-lg   "
					{...props}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Center Name  Arabic-->
	<Form.Field form={medicalFormObj} name="center_name_ar">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="block text-lg font-semibold text-gray-800"
					>Center Name (Arabic)</Form.Label
				>
				<Input
					type="text"
					dir="rtl"
					bind:value={$medicalForm.center_name_ar}
					class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
					{...props}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<!--Phone--->
	<Form.Field form={medicalFormObj} name="phone">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="block text-sm font-medium text-gray-700">
					{m.phone_number_title()}
				</Form.Label>
				<PhoneInput
					country="SY"
					{...props}
					bind:value={$medicalForm.phone}
					class="mt-1 w-full rounded-lg border-gray-300 shadow-sm"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<!--Specilazation-->
	<Form.Field form={medicalFormObj} name="specialization">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="block text-sm font-medium text-gray-700">
					{m.specialization_title()}
				</Form.Label>
				<Select.Root type="single" bind:value={$medicalForm.specialization} name={props.name}>
					<Select.Trigger {...props} class="mt-1 w-full rounded-lg border px-3 py-2">
						{$medicalForm.specialization === 'Empty'
							? m.specialization_wrong()
							: $medicalForm.specialization}
					</Select.Trigger>
					<Select.Content>
						{#each SPECIALIZATION_TYPES as option}
							{#if option != 'Empty'}
								<Select.Item value={option} label={option} />
							{/if}
						{/each}
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class=" flex w-full justify-between gap-2">
		<!-- Password -->
		<Form.Field form={medicalFormObj} name="password" class="w-full">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{m.password_label()}</Form.Label>
					<Password bind:value={$medicalForm.password} {...props} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<!-- Confirm Password -->
		<Form.Field form={medicalFormObj} name="password_confirmation" class="w-full">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{m.confirm_password_title()}</Form.Label>
					<Password bind:value={$medicalForm.password_confirmation} {...props} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<!-- Doctors Section -->
	<Form.Fieldset form={medicalFormObj} name="doctors">
		<Form.Legend class="text-lg font-semibold text-gray-800">{m.doctors()}</Form.Legend>

		<div class="space-y-8">
			{#each $medicalForm.doctors as _, i (i)}
				<Card.Root>
					<Card.Header>
						<h3>Doctor ({i + 1})</h3>
					</Card.Header>
					<Card.Content>
						<Form.Fieldset form={medicalFormObj} name={`doctors[${i}]`}>
							<!-- Row 1: Full Names -->
							<div class="grid grid-cols-2 gap-4">
								<!-- Fullname Arabic -->
								<Form.ElementField form={medicalFormObj} name={`doctors[${i}].name_ar`}>
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label class="block text-sm font-medium text-gray-700" dir="rtl"
												>الإسم بالكامل</Form.Label
											>
											<Input
												dir="rtl"
												{...props}
												lang="ar"
												bind:value={$medicalForm.doctors[i].name_ar}
												class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
											/>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.ElementField>

								<!-- Fullname English -->
								<Form.ElementField form={medicalFormObj} name={`doctors[${i}].name`}>
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>
												<Form.Label class="block text-sm font-medium text-gray-700" dir="ltr"
													>Full Name (English)</Form.Label
												>
											</Form.Label>
											<Input
												{...props}
												dir="ltr"
												lang="en"
												bind:value={$medicalForm.doctors[i].name}
												class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
											/>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.ElementField>
							</div>

							<!-- Row 2: Specialization + Phone -->
							<div class="mt-4 grid grid-cols-2 gap-4">
								<!-- Specialization -->
								<Form.ElementField form={medicalFormObj} name={`doctors[${i}].specialization`}>
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label class="block text-sm font-medium text-gray-700">
												{m.specialization_title()}
											</Form.Label>
											<Select.Root
												type="single"
												bind:value={$medicalForm.doctors[i].specialization}
												name={props.name}
											>
												<Select.Trigger {...props} class="mt-1 w-full rounded-lg border px-3 py-2">
													{$medicalForm.doctors[i].specialization === 'Empty'
														? m.specialization_wrong()
														: $medicalForm.doctors[i].specialization}
												</Select.Trigger>
												<Select.Content>
													{#each SPECIALIZATION_TYPES as option}
														{#if option != 'Empty'}
															<Select.Item value={option} label={option} />
														{/if}
													{/each}
												</Select.Content>
											</Select.Root>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.ElementField>

								<!-- Phone -->
								<Form.ElementField form={medicalFormObj} name={`doctors[${i}].phone`}>
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label class="block text-sm font-medium text-gray-700">
												{m.phone_number_title()}
											</Form.Label>
											<PhoneInput
												country="SY"
												{...props}
												bind:value={$medicalForm.doctors[i].phone}
												class="mt-1 w-full rounded-lg border-gray-300 shadow-sm"
											/>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.ElementField>
							</div>
							<div class="flex justify-between gap-2">
								<!-- Password -->
								<Form.ElementField
									form={medicalFormObj}
									name={`doctors[${i}].password`}
									class="w-full"
								>
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>{m.password_label()}</Form.Label>
											<Password bind:value={$medicalForm.doctors[i].password} {...props} />
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.ElementField>
								<!-- Confirm Password -->
								<Form.ElementField
									form={medicalFormObj}
									name={`doctors[${i}].password_confirmation`}
									class="w-full"
								>
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>{m.confirm_password_title()}</Form.Label>
											<Password
												bind:value={$medicalForm.doctors[i].password_confirmation}
												{...props}
											/>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.ElementField>
							</div>
						</Form.Fieldset>
					</Card.Content>

					<!-- Remove Doctor Button -->
					{#if i > 1}
						<Card.Footer>
							<Button
								type="button"
								variant="destructive"
								class="mt-4"
								onclick={() => removeDoctorByIndex(i)}
							>
								<Trash />
							</Button>
						</Card.Footer>
					{/if}
				</Card.Root>
			{/each}
		</div>
	</Form.Fieldset>

	<!-- Add Doctor -->
	<Button type="button" onclick={addDoctor} class="  px-4 py-2">{m.add_doctor()}</Button>

	<!-- Submit -->
	<Button
		type="submit"
		class={[
			'w-full rounded-xl  py-3  shadow-md transition ',
			$medicalSubmitting ? 'animate-pulse' : ''
		]}
		disabled={$medicalSubmitting}
	>
		{$medicalSubmitting ? 'Creating Account...' : 'Create Account'}
	</Button>
</form>
