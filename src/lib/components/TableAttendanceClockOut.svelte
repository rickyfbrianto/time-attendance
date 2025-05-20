<script>
	import { formatTanggal } from "@lib/utils";
    import { Badge } from 'flowbite-svelte';
    import { differenceInMinutes, differenceInCalendarDays, differenceInDays, format, getYear, getDate } from "date-fns";
    
    let {check_out, check_out2, check_in} = $props()
</script>

<div class="flex flex-col items-start gap-2">
    {#if formatTanggal(check_out, "time").slice(0,2) != "00"} <!-- Check Out1 -->
        <Badge color="dark">
            {formatTanggal(check_out, differenceInCalendarDays(formatTanggal(check_out), formatTanggal(check_in)) > 0 
                ? "datetime" : "time")}
        </Badge>
    {/if}
    {#if formatTanggal(check_out2, "time")} 
        <Badge color="yellow">
            {formatTanggal(check_out2, differenceInCalendarDays(formatTanggal(check_out2), formatTanggal(check_in)) > 0 
                ? "datetime" : "time")}
        </Badge>
    {/if}
</div>