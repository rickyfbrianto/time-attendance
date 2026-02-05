<script lang='ts'>
    import classNames from 'classnames'
    let {type="button", size="md", children, onclick, className = "", disabled = false } : {type?:"button" | "submit" | "reset" | null | undefined, size?: "sm"|"md"|"lg", children: any, onclick?: ()=>void, className?:string, disabled?:boolean} = $props()
    const myClass = classNames(`MyButton ${size == "sm" ? "p-1":(size == "md" ? "p-2": (size == "lg" ?"p-3":"p-0"))} border border-zinc-200 hover:bg-slate-300 dark:hover:bg-slate-400 transition duration-300 ease-in-out rounded-lg shadow-sm ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`, className)
</script>

<button {disabled} class={myClass} {onclick}>{@render children()}</button>