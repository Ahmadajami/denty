<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	let { navs } = $props();
</script>

<Sidebar.Group>
	<Sidebar.Menu>
		{#each navs as item (item.name)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class={item.isActive ? 'bg-primary' : ''}>
					{#snippet child({ props })}
						<a href={item.url} {...props}>
							<item.icon />
							<!-- bigger icons -->
							<span class="text-lg font-medium">{item.name}</span>
							<!-- bigger text -->
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
