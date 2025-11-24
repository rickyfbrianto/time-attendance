Setiap program dijalankan pastikan attachment folder sudah dibuat symlink ke network share

Ada 2 folder yang digunakan untuk sharing 

- src/lib/assets/media -> Internal folder untuk save dan update
- express/storage/media -> Service folder untuk preview

Jalankan perintah mklink /D [src/lib/assets/media] [network_share]
