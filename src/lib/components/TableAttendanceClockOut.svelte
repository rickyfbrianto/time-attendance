<script>
	import { formatTanggal } from "$/lib/utils";
    import { Badge, Tooltip } from 'flowbite-svelte';
    import { differenceInCalendarDays } from "date-fns";
    
    let {check_out, check_out2, check_in} = $props()
</script>

<div class="flex flex-col items-center gap-2">
    {#if formatTanggal(check_out, "time").slice(0,2) != "00"} <!-- Check Out1 -->
        <Badge color="dark">
            {formatTanggal(check_out, differenceInCalendarDays(formatTanggal(check_out), formatTanggal(check_in)) > 0 
                ? "datetime" : "time")}
        </Badge>
        <Tooltip class='z-10'>{formatTanggal(check_out)}</Tooltip>
    {/if}
    {#if formatTanggal(check_out2, "time")} 
        <Badge color="yellow">
            {formatTanggal(check_out2, differenceInCalendarDays(formatTanggal(check_out2), formatTanggal(check_in)) > 0 
                ? "datetime" : "time")}
        </Badge>
        <Tooltip class='z-10'>{formatTanggal(check_out2)}</Tooltip>
    {/if}
</div>