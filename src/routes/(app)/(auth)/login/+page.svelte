<script lang="ts">
	//--Basic Compoenent
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	////Lucid Icons
	import Eye from '@lucide/svelte/icons/eye';
	import EyeClosed from '@lucide/svelte/icons/eye-closed';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	//data Handling
	import type { PageProps } from './$types';
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { authschema } from '$lib/auth/schema';
	import { toast } from 'svelte-sonner';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Langugetoggle from '$lib/components/layout/Langugetoggle.svelte';
	import PhoneInput from '$lib/components/ui/phone-input/phone-input.svelte';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	const form = superForm(data.form, {
		validators: zod4Client(authschema),
		resetForm: true
	});
	const { form: formData, enhance, delayed, message } = form;

	let show = $state(false);

	function togglePassword() {
		show = !show;
	}
	$effect(() => {
		if ($message) {
			toast.error($message);
		}
	});
	onMount(() => {
		if (data.phone) {
			console.log('phone is', data.phone);
			const p = '+' + data.phone;
			$formData.PhoneNumber = p.replace(/\s/g, '');
		}
	});
</script>

<div class="absolute top-8 ltr:right-8 rtl:left-8">
	<Langugetoggle />
</div>

<!-- Heading -->
<h2 class="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
	{m.vivid_wise_bullock_cheer()}
</h2>
<p class="mb-8 text-gray-600 dark:text-white/70">{m.email_desc()}</p>

<!-- Login form -->
<form id="Login" use:enhance method="POST" class="flex flex-col gap-6">
	<!-- PhoneNumber -->
	<div class="grid gap-2">
		<Form.Field {form} name="PhoneNumber">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="PhoneNumber">{m.phone_number_title()}</Form.Label>
					<PhoneInput bind:value={$formData.PhoneNumber} {...props} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>
	<!-- Password -->
	<div class="grid gap-2">
		<Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="password">{m.password_label()}</Form.Label>
					<div class="relative">
						<Input
							type={!show ? 'password' : 'text'}
							bind:value={$formData.password}
							{...props}
							autocomplete="current-password"
							required
						/>
						<Button
							class="absolute inset-y-0 hover:bg-transparent ltr:right-0 rtl:left-0"
							variant="ghost"
							size="icon"
							onclick={togglePassword}
							aria-pressed={show}
							aria-label={show ? 'Hide Password' : 'Show Password'}
							aria-controls="password"
						>
							{#if show}
								<Eye aria-hidden="true" />
							{:else}
								<EyeClosed aria-hidden="true" />
							{/if}
						</Button>
					</div>
				{/snippet}
			</Form.Control>
			<Form.Description>{m.password_desc()}</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<a href="##" class="ml-auto inline-block text-sm underline-offset-4 hover:underline">
			{m.forget_desc()}
		</a>
	</div>

	<!-- Submit -->
	<Form.Button class="inline-flex w-full justify-center" form="Login" disabled={$delayed}>
		{#if $delayed}
			<LoaderCircle class="animate-spin" />
		{/if}
		{m.log_in()}
	</Form.Button>
</form>

<!-- Link to signup -->
<div class="mt-6 w-full text-sm">
	<Button class="w-full" variant="link" href={localizeHref('/signup')}>{m.sign_up()}</Button>
</div>
