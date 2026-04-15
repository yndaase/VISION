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

// Default materials  Admin updates these via the portal.
// URL should be a Google Drive direct-download link or any public file link.
// Google Drive format: https://drive.google.com/uc?export=download&id=FILE_ID
const SEED_MATERIALS = [
  {
    id: "s1",
    subject: "core-maths",
    title: "Core Maths Study Guide 2026",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s2",
    subject: "core-maths",
    title: "Core Maths Past Questions 2020-2025",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s3",
    subject: "english",
    title: "English Language Comprehension Pack",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s4",
    subject: "english",
    title: "Essay Writing & Summary Guide",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s5",
    subject: "social",
    title: "Social Studies Complete Notes",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s6",
    subject: "physics",
    title: "Physics Formula Sheet & Guide",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s7",
    subject: "physics",
    title: "Physics Past Questions 2020-2025",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s8",
    subject: "chemistry",
    title: "Chemistry Notes & Equations",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s9",
    subject: "biology",
    title: "Biology Complete Revision Notes",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s10",
    subject: "economics",
    title: "Economics Study Pack 2026",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
  {
    id: "s11",
    subject: "cs",
    title: "Computer Science Study Guide",
    type: "PDF",
    size: "",
    url: "#",
    uploadedBy: "admin",
    uploadedAt: "2026-04-01",
  },
];

/**
 * Get all materials (from localStorage, falling back to seeds)
 */
function getMaterials() {
  try {
    const stored = JSON.parse(
      localStorage.getItem("vision_materials") || "null",
    );
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  } catch (e) {}
  return SEED_MATERIALS;
}

/**
 * Sync materials from Firebase to localStorage
 */
async function syncMaterials() {
  if (typeof window.fbGetMaterials === 'function') {
    const cloud = await window.fbGetMaterials();
    if (cloud && cloud.length > 0) {
      saveMaterials(cloud);
      return cloud;
    }
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
 */
function upsertMaterial(mat) {
  const all = getMaterials();
  const idx = all.findIndex((m) => m.id === mat.id);
  if (idx >= 0) all[idx] = mat;
  else all.push(mat);
  saveMaterials(all);

  // Sync to Firebase if available
  if (typeof window.fbSaveMaterial === 'function') {
    window.fbSaveMaterial(mat).catch(console.error);
  }
}

/**
 * Delete a material by id (admin only)
 */
function deleteMaterial(id) {
  saveMaterials(getMaterials().filter((m) => m.id !== id));

  // Sync to Firebase if available
  if (typeof window.fbDeleteMaterial === 'function') {
    window.fbDeleteMaterial(id).catch(console.error);
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
