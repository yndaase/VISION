//
//  VISION EDUCATION  Learner Materials Engine
//  Admin posts materials via admin.html. Students download from dashboard.
//  Materials are stored in: localStorage key "vision_materials"
//  Default seed is defined here  admin can override/add via Admin Portal.
//

const SUBJECTS_META = [
  { id: "core-maths", name: "Core Mathematics", icon: "", color: "#6366f1" },
  { id: "english", name: "English Language", icon: "", color: "#f59e0b" },
  { id: "social", name: "Social Studies", icon: "", color: "#a78bfa" },
  { id: "physics", name: "Physics", icon: "", color: "#f87171" },
  { id: "chemistry", name: "Chemistry", icon: "", color: "#fb923c" },
  { id: "biology", name: "Biology", icon: "", color: "#4ade80" },
  { id: "economics", name: "Economics", icon: "", color: "#38bdf8" },
  { id: "cs", name: "Computer Science", icon: "", color: "#14b8a6" },
  { id: "science", name: "Integrated Science", icon: "", color: "#10b981" },
];

// Removed SEED_MATERIALS as we now rely on Firebase.

/**
 * Get all materials (from localStorage)
 */
function getMaterials() {
  try {
    const stored = JSON.parse(
      localStorage.getItem("vision_materials") || "null",
    );
    if (stored && Array.isArray(stored)) return stored;
  } catch (e) {}
  return [];
}

/**
 * Sync materials from Firebase to localStorage
 */
async function syncMaterials() {
  if (typeof window.fbGetMaterials === 'function') {
    try {
      const cloud = await window.fbGetMaterials();
      const newMaterials = cloud || [];
      saveMaterials(newMaterials);
      console.log('[Materials] Synced', newMaterials.length, 'materials from Firebase');
      return newMaterials;
    } catch(err) {
      console.error('[Materials] Firebase sync failed:', err.message);
    }
  } else {
    console.warn('[Materials] fbGetMaterials not available');
  }
  return getMaterials();
}

/**
 * Get materials for a specific subject
 */
function getMaterialsBySubject(subjectId) {
  return getMaterials().filter((m) => m.subject === subjectId);
}

/**
 * Save materials (admin only)
 */
function saveMaterials(materials) {
  localStorage.setItem("vision_materials", JSON.stringify(materials));
}

/**
 * Add or update a single material (admin only)
 * Returns a promise that resolves when Firebase sync is complete
 */
async function upsertMaterial(mat) {
  const all = getMaterials();
  const idx = all.findIndex((m) => m.id === mat.id);
  if (idx >= 0) all[idx] = mat;
  else all.push(mat);
  saveMaterials(all);

  // Sync to Firebase if available
  if (typeof window.fbSaveMaterial === 'function') {
    try {
      await window.fbSaveMaterial(mat);
      console.log('[Materials] Synced to Firebase:', mat.title);
    } catch(err) {
      console.error('[Materials] Firebase sync failed:', err.message);
    }
  } else {
    console.warn('[Materials] fbSaveMaterial not available - material saved locally only');
  }
}

/**
 * Delete a material by id (admin only)
 */
async function deleteMaterial(id) {
  saveMaterials(getMaterials().filter((m) => m.id !== id));

  // Sync to Firebase if available
  if (typeof window.fbDeleteMaterial === 'function') {
    try {
      await window.fbDeleteMaterial(id);
      console.log('[Materials] Deleted from Firebase:', id);
    } catch(err) {
      console.error('[Materials] Firebase delete failed:', err.message);
    }
  }
}

/**
 * Simple hash for generating IDs
 */
function genMatId() {
  return "mat-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

/**
 * Get material type badge color
 */
function matTypeColor(type) {
  const map = {
    PDF: "#f87171",
    VIDEO: "#fb923c",
    DOC: "#60a5fa",
    SLIDE: "#a78bfa",
    LINK: "#4ade80",
  };
  return map[type?.toUpperCase()] || "#94a3b8";
}
