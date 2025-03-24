<script lang="ts">
	import { Spinner } from "flowbite-svelte";
    let {message = "Loading"} = $props()
</script>

<div class="flex items-center gap-4 p-4 bg-bgdark border border-slate-300 rounded-lg">
    <Spinner color='green' size={6}/>
    {message}
</div>