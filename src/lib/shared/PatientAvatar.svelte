<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const isArabic = getLocale() === 'ar';

	let { p } = $props();
	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('');
	}
</script>

<Avatar.Root class="h-10 w-10">
	{#if p.avatar}
		<Avatar.Image src={p.avatar} alt={isArabic ? p.fullname_ar : p.fullname} />
	{:else}
		<Avatar.Fallback>
			{getInitials(isArabic ? p.fullname_ar : p.fullname)}
		</Avatar.Fallback>
	{/if}
</Avatar.Root>
<div class="flex-1">
	<div class="leading-none font-medium">{isArabic ? p.fullname_ar : p.fullname}</div>
</div>
