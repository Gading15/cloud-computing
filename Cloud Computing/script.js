// ======= CONFIGURE =======
const CLOUD_NAME = "df1xj9xx8"; // cloud name kamu
const UPLOAD_PRESET = "cloud_gading"; // upload preset kamu
// ==========================

console.log("✅ script.js loaded!");

// Ambil elemen HTML
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const status = document.getElementById("status");
const fileList = document.getElementById("fileList");

// Local cache key untuk menyimpan daftar hasil upload (karena client-side kita ga bisa list dari Cloudinary)
const CACHE_KEY = "cloudy_uploaded_files_v1";

// helper cache
function readCache(){
  try{
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  }catch(e){
    return [];
  }
}
function writeCache(arr){
  localStorage.setItem(CACHE_KEY, JSON.stringify(arr));
}

// render daftar file
function renderList(){
  const arr = readCache();
  fileList.innerHTML = "";
  if(arr.length === 0){
    fileList.innerHTML = "<li style='color:#666'>Belum ada file yang diupload</li>";
    return;
  }
  arr.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <a href="${item.secure_url}" target="_blank" rel="noopener">${item.original_filename || item.public_id}</a>
        <div style="font-size:.82rem; color:#444; margin-top:4px">${new Date(item.uploaded_at||item.created_at).toLocaleString()}</div>
      </div>
      <div>
        <button data-publicid="${item.public_id}">Hapus lokal</button>
      </div>
    `;
    fileList.appendChild(li);
  });

  // tombol hapus cache
  fileList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.publicid;
      const arr2 = readCache().filter(x => x.public_id !== id);
      writeCache(arr2);
      renderList();
      alert("File dihapus dari daftar lokal. Untuk hapus di Cloudinary buka Media Library.");
    });
  });
}

renderList();

// === UPLOAD HANDLER ===
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if(!file){ alert("Pilih file dulu 😅"); return; }

  uploadBtn.disabled = true;
  status.textContent = "Uploading... ⏳";

  try{
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: fd
    });

    if(!res.ok){
      const txt = await res.text();
      throw new Error("Upload gagal: " + txt);
    }

    const data = await res.json();
    console.log("✅ Upload sukses:", data);

    const arr = readCache();
    arr.push({
      public_id: data.public_id,
      secure_url: data.secure_url,
      original_filename: data.original_filename,
      created_at: data.created_at || new Date().toISOString()
    });
    writeCache(arr);

    status.textContent = "Upload sukses! ✅";
    fileInput.value = "";
    renderList();
  }catch(err){
    console.error(err);
    status.textContent = "Upload error 😭";
    alert("Upload gagal: " + err.message);
  }finally{
    uploadBtn.disabled = false;
    setTimeout(()=> status.textContent = "", 3000);
  }
});
