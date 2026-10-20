<?php
/**
 * Sync Endpoint - Push data from client to server
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

authenticateRequest();

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();
    
    $synced = [
        'buku' => 0,
        'anggota' => 0,
        'peminjaman' => 0,
        'petugas' => 0
    ];
    
    // Sync Buku
    if (isset($data['buku']) && is_array($data['buku'])) {
        $stmt = $pdo->prepare("
            INSERT INTO buku (
                id, kode_buku, judul, pengarang, penerbit, tahun_terbit, 
                isbn, kategori, rak_lokasi, jumlah_total, stok_tersedia, 
                sumber, keterangan, created_at, updated_at, deleted
            ) VALUES (
                :id, :kode_buku, :judul, :pengarang, :penerbit, :tahun_terbit,
                :isbn, :kategori, :rak_lokasi, :jumlah_total, :stok_tersedia,
                :sumber, :keterangan, :created_at, :updated_at, :deleted
            )
            ON DUPLICATE KEY UPDATE
                kode_buku = VALUES(kode_buku),
                judul = VALUES(judul),
                pengarang = VALUES(pengarang),
                penerbit = VALUES(penerbit),
                tahun_terbit = VALUES(tahun_terbit),
                isbn = VALUES(isbn),
                kategori = VALUES(kategori),
                rak_lokasi = VALUES(rak_lokasi),
                jumlah_total = VALUES(jumlah_total),
                stok_tersedia = VALUES(stok_tersedia),
                sumber = VALUES(sumber),
                keterangan = VALUES(keterangan),
                updated_at = VALUES(updated_at),
                deleted = VALUES(deleted)
        ");
        
        foreach ($data['buku'] as $buku) {
            $stmt->execute([
                ':id' => $buku['id'],
                ':kode_buku' => $buku['kode_buku'],
                ':judul' => $buku['judul'],
                ':pengarang' => $buku['pengarang'],
                ':penerbit' => $buku['penerbit'] ?? null,
                ':tahun_terbit' => $buku['tahun_terbit'] ?? null,
                ':isbn' => $buku['isbn'] ?? null,
                ':kategori' => $buku['kategori'],
                ':rak_lokasi' => $buku['rak_lokasi'] ?? null,
                ':jumlah_total' => $buku['jumlah_total'] ?? 1,
                ':stok_tersedia' => $buku['stok_tersedia'] ?? 1,
                ':sumber' => $buku['sumber'] ?? null,
                ':keterangan' => $buku['keterangan'] ?? null,
                ':created_at' => $buku['created_at'],
                ':updated_at' => $buku['updated_at'],
                ':deleted' => $buku['deleted'] ?? 0
            ]);
            $synced['buku']++;
        }
    }
    
    // Sync Anggota
    if (isset($data['anggota']) && is_array($data['anggota'])) {
        $stmt = $pdo->prepare("
            INSERT INTO anggota (
                id, nomor_anggota, nama, jenis, kelas, jenis_kelamin,
                alamat, no_hp, status, tanggal_daftar, created_at, updated_at, deleted
            ) VALUES (
                :id, :nomor_anggota, :nama, :jenis, :kelas, :jenis_kelamin,
                :alamat, :no_hp, :status, :tanggal_daftar, :created_at, :updated_at, :deleted
            )
            ON DUPLICATE KEY UPDATE
                nomor_anggota = VALUES(nomor_anggota),
                nama = VALUES(nama),
                jenis = VALUES(jenis),
                kelas = VALUES(kelas),
                jenis_kelamin = VALUES(jenis_kelamin),
                alamat = VALUES(alamat),
                no_hp = VALUES(no_hp),
                status = VALUES(status),
                tanggal_daftar = VALUES(tanggal_daftar),
                updated_at = VALUES(updated_at),
                deleted = VALUES(deleted)
        ");
        
        foreach ($data['anggota'] as $anggota) {
            $stmt->execute([
                ':id' => $anggota['id'],
                ':nomor_anggota' => $anggota['nomor_anggota'],
                ':nama' => $anggota['nama'],
                ':jenis' => $anggota['jenis'],
                ':kelas' => $anggota['kelas'] ?? null,
                ':jenis_kelamin' => $anggota['jenis_kelamin'] ?? null,
                ':alamat' => $anggota['alamat'] ?? null,
                ':no_hp' => $anggota['no_hp'] ?? null,
                ':status' => $anggota['status'] ?? 'aktif',
                ':tanggal_daftar' => $anggota['tanggal_daftar'] ?? null,
                ':created_at' => $anggota['created_at'],
                ':updated_at' => $anggota['updated_at'],
                ':deleted' => $anggota['deleted'] ?? 0
            ]);
            $synced['anggota']++;
        }
    }
    
    // Sync Peminjaman
    if (isset($data['peminjaman']) && is_array($data['peminjaman'])) {
        $stmt = $pdo->prepare("
            INSERT INTO peminjaman (
                id, kode_transaksi, anggota_id, buku_id, tanggal_pinjam,
                tanggal_jatuh_tempo, tanggal_kembali, status, petugas_id,
                catatan, denda, created_at, updated_at, deleted
            ) VALUES (
                :id, :kode_transaksi, :anggota_id, :buku_id, :tanggal_pinjam,
                :tanggal_jatuh_tempo, :tanggal_kembali, :status, :petugas_id,
                :catatan, :denda, :created_at, :updated_at, :deleted
            )
            ON DUPLICATE KEY UPDATE
                kode_transaksi = VALUES(kode_transaksi),
                anggota_id = VALUES(anggota_id),
                buku_id = VALUES(buku_id),
                tanggal_pinjam = VALUES(tanggal_pinjam),
                tanggal_jatuh_tempo = VALUES(tanggal_jatuh_tempo),
                tanggal_kembali = VALUES(tanggal_kembali),
                status = VALUES(status),
                petugas_id = VALUES(petugas_id),
                catatan = VALUES(catatan),
                denda = VALUES(denda),
                updated_at = VALUES(updated_at),
                deleted = VALUES(deleted)
        ");
        
        foreach ($data['peminjaman'] as $peminjaman) {
            $stmt->execute([
                ':id' => $peminjaman['id'],
                ':kode_transaksi' => $peminjaman['kode_transaksi'],
                ':anggota_id' => $peminjaman['anggota_id'],
                ':buku_id' => $peminjaman['buku_id'],
                ':tanggal_pinjam' => $peminjaman['tanggal_pinjam'],
                ':tanggal_jatuh_tempo' => $peminjaman['tanggal_jatuh_tempo'],
                ':tanggal_kembali' => $peminjaman['tanggal_kembali'] ?? null,
                ':status' => $peminjaman['status'],
                ':petugas_id' => $peminjaman['petugas_id'] ?? null,
                ':catatan' => $peminjaman['catatan'] ?? null,
                ':denda' => $peminjaman['denda'] ?? 0,
                ':created_at' => $peminjaman['created_at'],
                ':updated_at' => $peminjaman['updated_at'],
                ':deleted' => $peminjaman['deleted'] ?? 0
            ]);
            $synced['peminjaman']++;
        }
    }
    
    // Sync Petugas (metadata only, no password)
    if (isset($data['petugas']) && is_array($data['petugas'])) {
        $stmt = $pdo->prepare("
            INSERT INTO petugas (
                id, nama, jabatan, username, password, no_hp, peran, created_at, updated_at
            ) VALUES (
                :id, :nama, :jabatan, :username, '', :no_hp, :peran, :created_at, :updated_at
            )
            ON DUPLICATE KEY UPDATE
                nama = VALUES(nama),
                jabatan = VALUES(jabatan),
                no_hp = VALUES(no_hp),
                peran = VALUES(peran),
                updated_at = VALUES(updated_at)
        ");
        
        foreach ($data['petugas'] as $petugas) {
            $stmt->execute([
                ':id' => $petugas['id'],
                ':nama' => $petugas['nama'],
                ':jabatan' => $petugas['jabatan'] ?? null,
                ':username' => $petugas['username'],
                ':no_hp' => $petugas['no_hp'] ?? null,
                ':peran' => $petugas['peran'] ?? 'petugas',
                ':created_at' => $petugas['created_at'],
                ':updated_at' => $petugas['updated_at']
            ]);
            $synced['petugas']++;
        }
    }
    
    // Log sync
    $logStmt = $pdo->prepare("
        INSERT INTO sync_log (waktu, arah, jumlah_data, status, pesan)
        VALUES (NOW(), 'push', :jumlah, 'success', :pesan)
    ");
    $totalSynced = array_sum($synced);
    $logStmt->execute([
        ':jumlah' => $totalSynced,
        ':pesan' => json_encode($synced)
    ]);
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Sync completed',
        'synced' => $synced,
        'total' => $totalSynced
    ]);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("Sync error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sync failed: ' . $e->getMessage()
    ]);
}
