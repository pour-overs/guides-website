<script context="module">

  export async function preload(page, session) {

    const displayUnpublished = true;

    const res = await this.fetch(`/api/guides.json`);
    let guides = await res.json();

    if (!displayUnpublished) {
      guides = guides.filter( guide => guide.isPublished);
    }

    return { guides };
  }
</script>

<script>

  export let guides = [];

</script>

<style>
  .muted {
    opacity: 0.5;
  }

</style>

<h1>Guides</h1>

<nav>
  <ul>
    {#each guides as guide}
      <li class:muted={!guide.isPublished}>
        <a href={guide.slug.length > 1 ? `/guide/${guide.slug}` : null}>{guide.title}</a>
        {#if guide.slug.length <= 1}
          (<span>No slug</span>)
        {/if}
      </li>
    {:else}
      <li>
        <p>There are no published guides yet. Come back soon!</p>
      </li>
    {/each}
  </ul>
</nav>