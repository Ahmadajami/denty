<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Menu from '@lucide/svelte/icons/menu';
	import Themetoggle from '$lib/components/layout/Themetoggle.svelte';
	import GradintButton from '$lib/components/layout/GradintButton.svelte';
	import { onDestroy } from 'svelte';
	import { cn } from '$lib/utils';
	import Logo from '$lib/components/layout/Logo.svelte';
	import { shy } from './shy.svelte';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import Langugetoggle from './Langugetoggle.svelte';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	let mobileMenuOpen = $state(false);

	const hrefs = {
		home: localizeHref('/'),
		features: localizeHref('#features'),
		pricing: localizeHref('#pricing'),
		faq: localizeHref('#faq'),
		about: localizeHref('/about'),
		contact: localizeHref('#contact'),
		login: localizeHref('/login'),
		signup: localizeHref('/signup'),
		dashboard: localizeHref('/dashboard')
	};

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	let scrollY = $state(0);
	let lastScrollY = $state(0);

	const handleScroll = () => {
		const scrollingDown = lastScrollY < scrollY;
		shy.value = scrollingDown && scrollY > 200;
		lastScrollY = scrollY;
	};

	onDestroy(() => {
		// no lenis cleanup needed
	});
</script>

<svelte:window bind:scrollY on:scroll={handleScroll} />

<header>
	<nav
		class:nav-slide={shy.value}
		class={cn(
			'fixed top-0 left-0 z-50 h-18 w-full bg-transparent px-4 backdrop-blur-sm md:px-12',
			'animate-in duration-1000 slide-in-from-top-55'
		)}
		aria-label="Primary navigation"
	>
		<div class="mx-auto flex h-full max-w-7xl items-center justify-between">
			<!-- Left: Logo -->
			<a
				dir="ltr"
				href={hrefs.home}
				class="flex items-center font-serif text-2xl font-bold tracking-widest"
			>
				<Logo />
			</a>

			<!-- Center: Navigation (Desktop) -->
			<ul class="hidden gap-8 font-medium text-secondary-foreground md:flex">
				<li>
					<a href={hrefs.features} class="transition hover:text-primary">{m.features_nav()}</a>
				</li>
				<li><a href={hrefs.pricing} class="transition hover:text-primary">{m.pricing_nav()}</a></li>
				<li><a href={hrefs.faq} class="transition hover:text-primary">{m.faq_nav()}</a></li>
				<li><a href={hrefs.about} class="transition hover:text-primary">{m.about_nav()}</a></li>
				<li><a href={hrefs.contact} class="transition hover:text-primary">{m.contact_nav()}</a></li>
			</ul>

			<!-- Right: Buttons and Toggles -->
			<div class="flex items-center space-x-4">
				{#if !page.data.user}
					<a
						href={hrefs.login}
						class="hidden text-secondary-foreground transition hover:text-primary md:block"
						>{m.log_in()}</a
					>
					<GradintButton href={hrefs.signup} classname="hidden md:flex" />
					<Themetoggle />
					<Langugetoggle />
					<Button
						variant="ghost"
						class="md:hidden"
						onclick={toggleMobileMenu}
						aria-label="Open menu"
					>
						<Menu />
					</Button>
				{:else}
					<a href={hrefs.dashboard} class="hidden text-sm text-muted-foreground md:inline"
						>Welcome {page.data.user.username}</a
					>
					<form action="/logout" method="POST" use:enhance>
						<Button variant="ghost" type="submit" class="hover:text-primary">{m.log_out()}</Button>
					</form>
					<GradintButton href={hrefs.signup} classname="hidden md:flex" />
					<Themetoggle />
					<Langugetoggle />
					<Button
						variant="ghost"
						class="md:hidden"
						onclick={toggleMobileMenu}
						aria-label="Open menu"
					>
						<Menu />
					</Button>
				{/if}
			</div>
		</div>
	</nav>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div
			role="dialog"
			aria-modal="true"
			class="fixed inset-0 z-40 flex animate-in flex-col items-center justify-center space-y-6 bg-background/95 backdrop-blur-sm fade-in-0 slide-in-from-bottom-full md:hidden"
		>
			<Button
				variant="ghost"
				class="absolute top-4 right-4 text-secondary-foreground hover:text-primary"
				onclick={toggleMobileMenu}
				aria-label="Close menu"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-x"
				>
					<path d="M18 6 6 18" /><path d="m6 6 12 12" />
				</svg>
			</Button>

			<ul class="space-y-4 text-xl font-medium">
				<li>
					<a href={hrefs.features} onclick={toggleMobileMenu} class="transition hover:text-primary"
						>{m.features_nav()}</a
					>
				</li>
				<li>
					<a href={hrefs.pricing} onclick={toggleMobileMenu} class="transition hover:text-primary"
						>{m.pricing_nav()}</a
					>
				</li>
				<li>
					<a href={hrefs.faq} onclick={toggleMobileMenu} class="transition hover:text-primary"
						>{m.faq_nav()}</a
					>
				</li>
				<li>
					<a href={hrefs.about} onclick={toggleMobileMenu} class="transition hover:text-primary"
						>{m.about_nav()}</a
					>
				</li>
				<li>
					<a href={hrefs.contact} onclick={toggleMobileMenu} class="transition hover:text-primary"
						>{m.contact_nav()}</a
					>
				</li>
			</ul>

			<div class="flex flex-col space-y-4 pt-6">
				{#if !page.data.user}
					<a
						href={hrefs.login}
						onclick={toggleMobileMenu}
						class="text-lg transition hover:text-primary">{m.log_in()}</a
					>
					<GradintButton href={hrefs.signup}>{m.free_trail()}</GradintButton>
				{:else}
					<form action="/logout" method="POST" use:enhance>
						<Button variant="ghost" type="submit" class="text-lg hover:text-primary"
							>{m.log_out()}</Button
						>
					</form>
				{/if}
				<Themetoggle />
				<Langugetoggle />
			</div>
		</div>
	{/if}
</header>

<style>
	.nav-slide {
		transform: translateY(-200%);
		transition: transform 0.5s ease-in-out;
	}
</style>
