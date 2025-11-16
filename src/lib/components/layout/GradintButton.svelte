<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { m } from '$lib/paraglide/messages';

	let { children, href, classname }: { children?: Snippet; href: string; classname?: string } =
		$props();
</script>

<a
	{href}
	class={cn(
		' animate-background block rounded-2xl bg-linear-to-r from-green-300 via-blue-600 to-red-300 bg-size-[400%_400%] p-1 transition-all duration-150 animation-duration-[6s] hover:scale-105',
		classname
	)}
>
	<span
		class="bg-accent hover:text-primary text-secondary-foreground block rounded-2xl px-4 transition-colors duration-300"
	>
		{#if children}
			{@render children()}
		{:else}
			{m.free_trail()}
		{/if}
	</span>
</a>
