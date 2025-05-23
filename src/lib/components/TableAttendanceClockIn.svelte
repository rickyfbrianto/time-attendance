<script>
	import { formatTanggal } from "@lib/utils";
    import { Badge } from 'flowbite-svelte';
    
    let {check_in, check_in2} = $props()
</script>

<div class="flex flex-col items-center justify-start gap-2">
    {#if formatTanggal(check_in, "time").slice(0,2) != "00"}
        <Badge color="dark" title={formatTanggal(check_in)}>{formatTanggal(check_in, "time")}</Badge>
    {/if}
    {#if formatTanggal(check_in2, "time")}
        <Badge color="yellow" title={formatTanggal(check_in2)}>{formatTanggal(check_in2, "time")}</Badge>
    {/if}
</div>