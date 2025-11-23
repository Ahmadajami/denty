<script lang="ts">
	let { currIndex = $bindable(1), totalSteps = 4 } = $props();

	function clampIndex() {
		if (currIndex < 1) currIndex = 1;
		if (currIndex > totalSteps) currIndex = totalSteps;
	}

	let progressWidth = $derived(((currIndex - 1) / (totalSteps - 1)) * 100 + '%');

	function previous() {
		currIndex--;
		clampIndex();
	}

	function next() {
		currIndex++;
		clampIndex();
	}
</script>

<div class="flex w-full justify-center py-6">
	<div
		class="relative flex w-full max-w-xl items-center justify-between before:absolute before:top-1/2 before:h-[3px] before:w-full before:-translate-y-1/2 before:bg-gray-200 before:content-['']"
	>
		<!-- Progress Bar -->
		<div
			class="absolute top-1/2 h-[3px] -translate-y-1/2 bg-primary transition-all duration-700 ease-in-out"
			style="width: {progressWidth};"
		></div>

		<!-- Steps -->
		{#each Array(totalSteps) as _, index}
			<div
				class={[
					'relative z-1 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-500',
					index + 1 < currIndex
						? 'border-primary bg-primary text-white  shadow-sm'
						: index + 1 === currIndex
							? 'border-primary bg-white text-primary shadow'
							: 'border-gray-300 bg-white text-black '
				]}
				title="Step {index + 1}"
			>
				{index + 1}
			</div>
		{/each}
	</div>
</div>

<style>
	:global(.progress) {
		transition: width 0.8s ease-in-out;
	}
</style>
