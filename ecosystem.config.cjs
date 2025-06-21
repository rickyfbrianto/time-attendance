module.exports = {
    apps: [
        {
            name: 'time-dev',
            script: 'cmd',
            args: '/c pnpm run dev',
            autorestart: false,
        },
        {
            name: "time-fs",
            script: "cmd",
            args: "/c pnpm run file-server",
            autorestart: true
        },
        {
            name: "time-prod",
            script: "cmd",
            args: "/c pnpm run preview",
            autorestart: false
        }
    ]
};