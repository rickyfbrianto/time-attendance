<script>
	import { Button, Input } from "flowbite-svelte";

    let socket = $state(new WebSocket('ws://localhost:1110'))

    const onConnect = () => {
        socket = new WebSocket('ws://localhost:1110')

        socket.onmessage = event => {
            console.log("Dari server WS : ",event.data)
        }
    }

    const tes = () => socket.send(form.nama)
    
    const onDisconnect = () => socket.close()

    const form = $state({
        nama: ""
    })

</script>

<div class='ps-3'>
    <span>Socket Status {socket.readyState}</span>
    {JSON.stringify(form)}
    <Input bind:value={form.nama}/>
    <Button onclick={tes}>tes</Button>
    <Button onclick={onConnect}>Connect</Button>
    <Button onclick={onDisconnect}>Disconnect</Button>
</div>