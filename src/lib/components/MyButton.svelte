<script lang='ts'>
    let {type="button", children, onclick } : {type?:"button" | "submit" | "reset" | null | undefined, children: any, onclick?: ()=>void } = $props()
</script>

<button {type} class='p-3 border border-slate-300 rounded-lg cursor-pointer' {onclick}>{@render children()}</button>