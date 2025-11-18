<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: PageProps = $props();
</script>

<pre>
{JSON.stringify(data.user, null, 2)}
</pre>
<form action="/logout" method="POST" use:enhance>
	<Button type="submit">Log out</Button>
</form>
