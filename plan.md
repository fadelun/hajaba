# PRD: Hajaba (hijab style AI editor)

## 1. Project Overview
Membangun aplikasi web inovatif yang mampu memodifikasi gambar wanita (foto asli, kartun 2D, dan kartun 3D) dengan menambahkan hijab secara organik. Fokus utama adalah menjaga konsistensi identitas karakter, postur, dan gaya visual asli tanpa terlihat seperti tempelan manual.

## 2. Core Mechanism (The Engine)
* **AI Model:** Menggunakan **Nano Banana 2 (Gemini 3 Flash Image)** via API.
* **Method:** *Image-to-Image / Inpainting* berbasis instruksi teks (Natural Language).
* **Logic:** AI harus mendeteksi area rambut/leher secara otomatis dan menggantinya dengan hijab yang sesuai dengan pencahayaan serta tekstur gambar sumber.

## 3. Fitur Utama (Functional Requirements)
* **Smart Uploader:** Mendukung format JPG, PNG, WEBP dengan sistem *drag-and-drop*.
* **Style Detection:** Deteksi otomatis apakah input adalah Realistis, 2D, atau 3D untuk menyesuaikan hasil render hijab.
* **Hijab Customization:**
    * Pilihan tipe: Pashmina, Segiempat, Syar'i, Turban.
    * Input warna (Hex code atau color picker).
* **Live Preview Canvas:** Menampilkan perbandingan *Before vs After* secara berdampingan atau menggunakan slider.
* **HD Export:** Mengunduh hasil akhir dalam resolusi tinggi dengan metadata yang bersih.

## 4. Tech Stack (Technical Specifications)
* **Frontend:** Next js dan shadcn ui (UI/UX).
* **Backend & Database:** Supabase (untuk autentikasi user dan penyimpanan aset gambar).
* **API Integration:** Google AI Studio (Gemini API) untuk akses ke Nano Banana 2.
* **Deployment:** Vercel dengan optimasi keamanan menggunakan Cloudflare.

## 5. UI/UX Requirements
* Antarmuka minimalis, bersih, dan responsif (Mobile-first).
* Sistem *loading state* yang informatif saat AI sedang memproses gambar.
* Galeri riwayat untuk melihat hasil edit sebelumnya (tersimpan di Supabase).

---
> **Alur Kerja:** > 1. User mengunggah foto wanita (bisa foto asli atau kartun). 
> 2. User memilih gaya hijab dan warna melalui UI. 
> 3. Aplikasi mengirim gambar dan prompt ke API Gemini untuk melakukan 'inpainting' (menambahkan hijab sambil menjaga postur dan wajah asli). 
> 4. Hasil dikembalikan dan ditampilkan di layar dengan opsi unduh. 

