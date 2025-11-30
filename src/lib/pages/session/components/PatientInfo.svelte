<script lang="ts">
	import * as Card from '$lib/components/ui/card/index';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import Search from '$lib/shared/Search.svelte';
	import { normalizeTelInput, parsePhoneNumberWithError } from 'svelte-tel-input';
	import type { E164Number } from 'svelte-tel-input/types';
	import type { Snippet } from 'svelte';
	import { getLocale } from '$lib/paraglide/runtime';

	let {
		form,
		formData,

		addPatientDialog = $bindable<boolean>(),
		query = $bindable<E164Number>(),
		submit,
		onValue
	}: {
		form: any;
		formData: any;
		addPatientDialog: boolean;
		query: E164Number;

		submit: Snippet;
		onValue: (value: E164Number) => void;
	} = $props();
	function onNoPatient() {
		addPatientDialog = true;
	}
	function onValueChange(value: string) {
		try {
			const tt = parsePhoneNumberWithError(value);
			const normalized = normalizeTelInput(tt);
			query = normalized.e164;
			onValue(normalized.e164 as E164Number);
			console.log('onValue Parsed Succsess', normalized.e164);
		} catch (err) {
			console.log('onValue Parsed Error', err);
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
</script>

<Card.Root
	class="w-full max-w-md animate-in transition-all duration-300 ease-in-out fade-in slide-in-from-bottom-4 "
>
	<Card.Header class="flex flex-col items-center space-y-2 pb-4 text-center">
		<h2 class="text-3xl font-semibold tracking-tight">Patient Information</h2>
		<p class="text-sm">Enter the patient’s phone number to begin.</p>
	</Card.Header>

	<Card.Content class="flex flex-col gap-5 p-6">
		<Form.Fieldset {form} name="phone" class="space-y-3">
			<Form.Legend class="text-sm font-medium ">Patient Phone Number</Form.Legend>

			<RadioGroup.Root
				name="phone"
				bind:value={$formData.phone}
				{onValueChange}
				class="flex flex-col gap-2"
			>
				{#key $formData.phone}
					<Search
						bind:query={() => query, (phone) => (query = getE164Number(phone) ?? phone)}
						{onNoPatient}
					>
						{#snippet row(p)}
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										class="relative my-1 flex w-full cursor-pointer items-center justify-between rounded-lg  p-4 transition-all hover:bg-accent hover:text-accent-foreground"
									>
										<RadioGroup.Item value={p.phoneNumber} class="peer sr-only" {...props} />

										<div
											class="pointer-events-none absolute inset-0 rounded-lg border-2 border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
										></div>

										<!-- Content Wrapper -->
										<div class="z-10 flex w-full flex-col text-left rtl:text-right">
											<p class="text-sm leading-none font-medium">
												{getLocale() === 'ar' ? p.fullnameAr : p.fullnameEn}
											</p>
											<p class="mt-1.5 text-xs text-muted-foreground rtl:text-right" dir="ltr">
												{p.phoneNumber}
											</p>
										</div>
									</Form.Label>
								{/snippet}
							</Form.Control>
						{/snippet}
					</Search>
				{/key}
			</RadioGroup.Root>

			<Form.FieldErrors />
		</Form.Fieldset>
	</Card.Content>

	<Card.Footer class="flex justify-end border-t border-gray-100 p-4">
		{@render submit()}
	</Card.Footer>
</Card.Root>
