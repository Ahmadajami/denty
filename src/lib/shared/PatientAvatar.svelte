<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { Patient } from '$lib/server/db/generated/prisma/client';

	const isArabic = getLocale() === 'ar';

	let { p }: { p: Patient } = $props();
	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('');
	}
	let src = undefined;
</script>

<Avatar.Root class="h-10 w-10">
	{#if src}
		<Avatar.Image {src} alt={isArabic ? p.fullnameAr : p.fullnameEn} />
	{:else}
		<Avatar.Fallback>
			{getInitials(isArabic ? p.fullnameAr : p.fullnameEn)}
		</Avatar.Fallback>
	{/if}
</Avatar.Root>
<div class="flex-1">
	<div class="leading-none font-medium">{isArabic ? p.fullnameAr : p.fullnameEn}</div>
</div>
