import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import path from 'path'

const app = express()
const port_express = process.env.PORT_EXPRESS || 1111
const host_svelte = process.env.HOST_SVELTE
const port_svelte = process.env.PORT_SVELTE || 1000

app.use(cors({
    origin: [`http://localhost:1100`, `http://localhost:${port_svelte}`,
         `http://${host_svelte}:${port_svelte}`, `http://${host_svelte}:1100`],
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}))

app.use('/storage', express.static(path.resolve('storage')));

app.get('/', (req, res) => {
    return res.json({ msg: "Ini adalah response dari server assets" })
})

app.listen(port_express, "0.0.0.0", () => {
    console.log(`Server running on port ${port_express}`)
})