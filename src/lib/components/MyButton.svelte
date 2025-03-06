<script lang='ts'>
    import classNames from 'classnames'
    let {type="button", children, onclick, className = "", disabled = false } : {type?:"button" | "submit" | "reset" | null | undefined, children: any, onclick?: ()=>void, className?:string, disabled?:boolean} = $props()
    const myClass = classNames(`p-3 border border-slate-300 rounded-lg ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`, className)
</script>

<button {type} {disabled} class={myClass} {onclick}>{@render children()}</button>