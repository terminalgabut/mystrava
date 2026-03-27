// root/js/services/supabase.js

// Gunakan CDN jika kamu tidak menggunakan build tools (Vite/Webpack)
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
/* FIX: Tambahkan tanda kutip penutup (') di akhir key */
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

/* Gunakan global variabel jika script di-load via <script src="..."> di index.html */
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
