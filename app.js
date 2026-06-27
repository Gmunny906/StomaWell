// ─── State ───────────────────────────────────────────────────────────────────
let allTips = [];           // all tips loaded from JSON
let activeCategory = "All"; // currently selected filter
let savedIds = new Set(JSON.parse(localStorage.getItem("savedTips") || "[]"));

// ─── DOM references ───────────────────────────────────────────────────────────
const tipsGrid      = document.getElementById("tips-grid");
const filterButtons = document.querySelectorAll(".filter-btn");
const savedList     = document.getElementById("saved-list");
const savedCount    = document.getElementById("saved-count");
const loadingMsg    = document.getElementById("loading-msg");
const errorMsg      = document.getElementById("error-msg");

// ─── Fetch tips from JSON ─────────────────────────────────────────────────────
async function loadTips() {
  showLoading(true);
  try {
    const response = await fetch("stomaTips.json");
    if (!response.ok) throw new Error("Could not load tips file.");
    const data = await response.json();
    allTips = data.tips;
    showLoading(false);
    renderTips();
    renderSavedList();
  } catch (err) {
    showLoading(false);
    showError(err.message);
  }
}

// ─── Render tip cards ─────────────────────────────────────────────────────────
function renderTips() {
  const filtered =
    activeCategory === "All"
      ? allTips
      : allTips.filter((t) => t.category === activeCategory);

  tipsGrid.innerHTML = "";

  if (filtered.length === 0) {
    tipsGrid.innerHTML = `<p class="empty-msg">No tips found in this category.</p>`;
    return;
  }

  filtered.forEach((tip) => {
    const isSaved = savedIds.has(tip.id);
    const card = document.createElement("article");
    card.classList.add("tip-card");
    card.setAttribute("aria-label", tip.title);

    card.innerHTML = `
      <div class="card-header">
        <span class="category-badge">${tip.category}</span>
        <button
          class="save-btn ${isSaved ? "saved" : ""}"
          aria-label="${isSaved ? "Remove from My Care List" : "Save to My Care List"}"
          data-id="${tip.id}">
          ${isSaved ? "★ Saved" : "☆ Save"}
        </button>
      </div>
      <h3 class="card-title">${tip.title}</h3>
      <p class="card-summary">${tip.summary}</p>
      <button class="expand-btn" aria-expanded="false" data-id="${tip.id}">
        Show details ▾
      </button>
      <div class="card-details hidden" id="details-${tip.id}">
        <p>${tip.details}</p>
      </div>
    `;

    // Expand/collapse details
    card.querySelector(".expand-btn").addEventListener("click", (e) => {
      toggleDetails(e.currentTarget, tip.id);
    });

    // Save / unsave
    card.querySelector(".save-btn").addEventListener("click", (e) => {
      toggleSave(e.currentTarget, tip.id);
    });

    tipsGrid.appendChild(card);
  });
}

// ─── Expand / collapse tip details ───────────────────────────────────────────
function toggleDetails(btn, id) {
  const detailsEl = document.getElementById(`details-${id}`);
  const isExpanded = btn.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    detailsEl.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Show details ▾";
  } else {
    detailsEl.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");
    btn.textContent = "Hide details ▴";
  }
}

// ─── Save / unsave a tip ──────────────────────────────────────────────────────
function toggleSave(btn, id) {
  if (savedIds.has(id)) {
    savedIds.delete(id);
    btn.classList.remove("saved");
    btn.textContent = "☆ Save";
    btn.setAttribute("aria-label", "Save to My Care List");
  } else {
    savedIds.add(id);
    btn.classList.add("saved");
    btn.textContent = "★ Saved";
    btn.setAttribute("aria-label", "Remove from My Care List");
  }

  // Persist to localStorage
  localStorage.setItem("savedTips", JSON.stringify([...savedIds]));
  renderSavedList();
}

// ─── Render "My Care List" sidebar ───────────────────────────────────────────
function renderSavedList() {
  savedList.innerHTML = "";
  savedCount.textContent = savedIds.size;

  if (savedIds.size === 0) {
    savedList.innerHTML = `<li class="empty-saved">Save a tip to build your personal care list.</li>`;
    return;
  }

  savedIds.forEach((id) => {
    const tip = allTips.find((t) => t.id === id);
    if (!tip) return;
    const li = document.createElement("li");
    li.classList.add("saved-item");
    li.innerHTML = `
      <span>${tip.title}</span>
      <button class="remove-btn" aria-label="Remove ${tip.title}" data-id="${tip.id}">✕</button>
    `;
    li.querySelector(".remove-btn").addEventListener("click", () => {
      savedIds.delete(id);
      localStorage.setItem("savedTips", JSON.stringify([...savedIds]));
      renderSavedList();
      renderTips(); // refresh cards so star updates
    });
    savedList.appendChild(li);
  });
}

// ─── Filter buttons ───────────────────────────────────────────────────────────
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    activeCategory = btn.dataset.category;
    renderTips();
  });
});

// ─── Loading / error helpers ──────────────────────────────────────────────────
function showLoading(show) {
  loadingMsg.hidden = !show;
  tipsGrid.hidden = show;
}

function showError(message) {
  errorMsg.hidden = false;
  errorMsg.textContent = `Error: ${message} Please refresh the page or check that stomaTips.json is in the same folder.`;
  tipsGrid.hidden = true;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
loadTips();
