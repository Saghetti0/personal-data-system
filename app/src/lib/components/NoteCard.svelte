<script lang="ts">
	import type { Note, Tag } from '$shared/types';
	import { formatTime, wordCount } from '$lib/utils/format';

	interface Props {
		note: Note;
		/** Resolved Tag objects corresponding to note.fields.tags IDs. */
		tags?: Tag[];
		/** URL of a thumbnail image, e.g. from the first image attachment. */
		imageUrl?: string;
	}

	let { note, tags: origTags = [], imageUrl }: Props = $props();

	const title = $derived(note.fields.title);
	const body = $derived(note.fields.body);
	const when = $derived(note.fields.when);
	const tags = $derived(note.fields.tags?.map(i => origTags.find(j => j.id == i)).filter(i => i !== undefined) ?? [])

	// With an image in the card, horizontal space for tags is tight.
	const hasFooter = $derived(!!(when || tags.length));

	// 4 if nothing is there, -1 for the title, -1 for the footer
	const bodyLines = $derived(4 + (title ? -1 : 0) + (hasFooter ? -1 : 0));
</script>

<!--
  Fixed-height note card. Any combination of title, body, timestamp, tags,
  and image is supported — the layout adapts to whatever fields are present.
-->

<a href={`/notes/${note.id}`}>
	<div class="bg-surface border border-overlay rounded-card h-[120px] flex overflow-hidden">

		<!-- Text column -->
		<div class="flex flex-col flex-1 min-w-0 gap-1 px-3 py-2.5">

			{#if title}
				<p class="shrink-0 font-semibold text-[18px] leading-7 text-ink truncate">
					{title}
				</p>
			{/if}

			{#if body}
				<div class="flex-1 min-h-0 overflow-hidden">
					<p class="text-base leading-6 text-ink line-clamp-{bodyLines}">
						{body}
					</p>
				</div>
			{/if}

			{#if hasFooter}
				<div class="shrink-0 flex items-center gap-[10px] font-medium text-[14px] leading-[14px]">

					{#if when}
						<span class="shrink-0 text-ink-dim">{formatTime(when)}</span>
					{/if}

					<!-- glorious hack: render tags as text so we can use text-overflow -->
					{#if origTags.length}
						<div class="text-brand overflow-hidden whitespace-nowrap text-right" style="text-overflow: ' ({origTags.length})';">
							{#each tags as tag (tag.id)}
								<!-- BUG: descenders don't render because they get cut off... -->
								<span class="mr-1.5">#{tag.name}</span>
							{/each}
						</div>
					{/if}

				</div>
			{/if}

		</div>

		{#if imageUrl}
			<div class="shrink-0 size-[120px]">
				<img src={imageUrl} alt="" class="size-full object-cover" />
			</div>
		{/if}

	</div>
</a>
