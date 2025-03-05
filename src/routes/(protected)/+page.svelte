<script>
    import { Alert } from 'flowbite-svelte';
</script>

<main>
    <Alert>
        <span class="font-medium">Info alert!</span>
        Change a few things up and try submitting again.
    </Alert>
</main>

<style lang="postcss">
    @reference "tailwindcss/theme";
    /* :global(html) {
      background-color: theme(--color-gray-100);
    } */
  </style>