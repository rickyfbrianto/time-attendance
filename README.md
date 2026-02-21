Setiap program dijalankan pastikan attachment folder sudah dibuat symlink ke network share

Ada folder yang digunakan untuk sharing

- src/lib/assets/media -> Internal folder untuk save dan update

Jalankan perintah mklink /D [src/lib/assets/media] [network_share]
