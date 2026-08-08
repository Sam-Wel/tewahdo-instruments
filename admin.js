const lockScreen = document.getElementById("lockScreen");
const adminWrap = document.getElementById("adminWrap");
const pwInput = document.getElementById("pwInput");
const unlockBtn = document.getElementById("unlockBtn");
const lockError = document.getElementById("lockError");

const form = document.getElementById("mezmurForm");
const entryIdEl = document.getElementById("entryId");
const fTitle = document.getElementById("fTitle");
const fTopic = document.getElementById("fTopic");
const fLanguage = document.getElementById("fLanguage");
const fSpeed = document.getElementById("fSpeed");
const fMedia = document.getElementById("fMedia");
const fLyrics = document.getElementById("fLyrics");
const formTitle = document.getElementById("formTitle");
const formStatus = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const adminList = document.getElementById("adminList");
const adminSearch = document.getElementById("adminSearch");

function getPassword() {
  return localStorage.getItem("zimare_admin_pw") || "";
}

async function apiCall(method, body, idForDelete) {
  const url = idForDelete ? `/api/mezmur?id=${encodeURIComponent(idForDelete)}` : "/api/mezmur";
  const resp = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-admin-password": getPassword() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (resp.status === 401) throw new Error("Wrong password");
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${resp.status})`);
  }
  return resp.status === 204 ? null : resp.json();
}

async function fetchAll(search) {
  const params = new URLSearchParams({ select: "*", order: "title.asc" });
  if (search) params.set("title", `ilike.*${search}*`);
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur?${params.toString()}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return resp.json();
}

function resetForm() {
  entryIdEl.value = "";
  form.reset();
  formTitle.textContent = "Add mezmur";
  submitBtn.textContent = "Save";
  cancelEditBtn.style.display = "none";
}

function fillForm(entry) {
  entryIdEl.value = entry.id;
  fTitle.value = entry.title;
  fTopic.value = (entry.topics || []).join(", ");
  fLanguage.value = entry.language;
  fSpeed.value = entry.speed;
  fMedia.value = entry.media_url || "";
  fLyrics.value = entry.lyrics;
  formTitle.textContent = `Edit: ${entry.title}`;
  submitBtn.textContent = "Update";
  cancelEditBtn.style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function refreshAdminList() {
  const rows = await fetchAll(adminSearch.value.trim());
  adminList.innerHTML = "";
  if (rows.length === 0) {
    adminList.innerHTML = `<div class="empty-state">No entries yet.</div>`;
    return;
  }
  rows.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div>
        <div class="admin-row-title">${entry.title}</div>
        <div class="admin-row-meta">${(entry.topics || []).join(", ")} · ${entry.language} · ${entry.speed}</div>
      </div>
      <div class="admin-row-actions">
        <button class="btn btn-secondary" data-action="edit">Edit</button>
        <button class="btn btn-danger" data-action="delete">Delete</button>
      </div>
    `;
    row.querySelector('[data-action="edit"]').addEventListener("click", () => fillForm(entry));

    const deleteBtn = row.querySelector('[data-action="delete"]');
    let confirming = false;
    let resetTimer = null;
    deleteBtn.addEventListener("click", async () => {
      if (!confirming) {
        confirming = true;
        deleteBtn.textContent = "Confirm delete?";
        resetTimer = setTimeout(() => {
          confirming = false;
          deleteBtn.textContent = "Delete";
        }, 6000);
        return;
      }
      clearTimeout(resetTimer);
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";
      try {
        await apiCall("DELETE", null, entry.id);
        refreshAdminList();
      } catch (err) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = "Delete";
        confirming = false;
        formStatus.textContent = err.message;
      }
    });
    adminList.appendChild(row);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.textContent = "Saving...";
  const payload = {
    title: fTitle.value.trim(),
    topics: fTopic.value.split(",").map((t) => t.trim()).filter(Boolean),
    language: fLanguage.value,
    speed: fSpeed.value,
    media_url: fMedia.value.trim() || null,
    lyrics: fLyrics.value,
  };
  try {
    if (entryIdEl.value) {
      await apiCall("PUT", { id: Number(entryIdEl.value), ...payload });
    } else {
      await apiCall("POST", payload);
    }
    formStatus.textContent = "Saved.";
    resetForm();
    refreshAdminList();
  } catch (err) {
    formStatus.textContent = err.message;
  }
});

cancelEditBtn.addEventListener("click", resetForm);
adminSearch.addEventListener("input", () => {
  clearTimeout(adminSearch._t);
  adminSearch._t = setTimeout(refreshAdminList, 300);
});

async function verifyPassword(pw) {
  // GET isn't a supported method on /api/mezmur, but the handler checks the
  // password before checking the method — so a wrong password still 401s,
  // while a right one falls through to a harmless 405. No data is touched.
  const resp = await fetch("/api/mezmur", { headers: { "x-admin-password": pw } });
  return resp.status !== 401;
}

unlockBtn.addEventListener("click", async () => {
  const pw = pwInput.value;
  const ok = await verifyPassword(pw);
  if (!ok) {
    lockError.textContent = "Wrong password.";
    return;
  }
  localStorage.setItem("zimare_admin_pw", pw);
  lockScreen.style.display = "none";
  adminWrap.style.display = "block";
  refreshAdminList();
});

if (getPassword()) {
  lockScreen.style.display = "none";
  adminWrap.style.display = "block";
  refreshAdminList();
}
