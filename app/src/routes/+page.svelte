<script lang="ts">
  import NoteCard from "$lib/components/NoteCard.svelte";
    import { WhenPrecision } from "$shared/types";
</script>

<div style="width: 412px; margin: 32px;">
  <NoteCard note={{id: 0, created_at: "0", last_modified_at: "0", fields: {
    title: "no shot this just works",
    body: "according to all known laws of aviation, there is no way a bee should be able to fly. according to all known laws of aviation, there is no way a bee should be able to fly. according to all known laws of aviation, there is no way a bee should be able to fly.",
    when: { timestamp: "2026-02-19T03:29:53Z", precision: WhenPrecision.DateTime, timezone: "America/New_York" },
    tags: [123, 456, 1, 3]
  }}} tags={[ 
    { id: 123, name: "accord" }, 
    { id: 456, name: "ing" },
    { id: 1, name: "to-all" },
    { id: 2, name: "known" },
    { id: 3, name: "lwkejf" },
  ]}></NoteCard>
</div>
