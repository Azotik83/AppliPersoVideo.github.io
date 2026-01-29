import { openDB } from 'idb';

const DB_NAME = 'video-manager-db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

// Initialize database
export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                const store = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
                store.createIndex('status', 'status');
                store.createIndex('createdAt', 'createdAt');
                store.createIndex('scheduledDate', 'scheduledDate');
            }
        },
    });
}

// Generate unique ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create default project
export function createDefaultProject(overrides = {}) {
    return {
        id: generateId(),
        title: 'New Project',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null, // Date when status changed to 'published'
        scheduledDate: null,
        tags: [],
        thumbnail: null,
        script: '',
        scenario: '',
        videoFiles: [],
        audioFiles: [],
        socialLinks: {
            youtube: '',
            tiktok: '',
            instagram: '',
            twitter: '',
            other: '',
        },
        checklist: [
            { id: generateId(), text: 'Write script', completed: false },
            { id: generateId(), text: 'Create storyboard', completed: false },
            { id: generateId(), text: 'Record video', completed: false },
            { id: generateId(), text: 'Edit video', completed: false },
            { id: generateId(), text: 'Add audio', completed: false },
            { id: generateId(), text: 'Export & publish', completed: false },
        ],
        ...overrides,
    };
}

// Get all projects
export async function getAllProjects() {
    const db = await initDB();
    return db.getAll(PROJECTS_STORE);
}

// Get project by ID
export async function getProject(id) {
    const db = await initDB();
    return db.get(PROJECTS_STORE, id);
}

// Add project
export async function addProject(project) {
    const db = await initDB();
    const newProject = createDefaultProject(project);
    await db.add(PROJECTS_STORE, newProject);
    return newProject;
}

// Update project
export async function updateProject(id, updates) {
    const db = await initDB();
    const project = await db.get(PROJECTS_STORE, id);
    if (!project) throw new Error('Project not found');

    const updatedProject = {
        ...project,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await db.put(PROJECTS_STORE, updatedProject);
    return updatedProject;
}

// Delete project
export async function deleteProject(id) {
    const db = await initDB();
    await db.delete(PROJECTS_STORE, id);
}

// Get projects by status
export async function getProjectsByStatus(status) {
    const db = await initDB();
    const index = db.transaction(PROJECTS_STORE).store.index('status');
    return index.getAll(status);
}

// Export all data as JSON
export async function exportData() {
    const projects = await getAllProjects();
    // Remove file handles as they can't be serialized
    const exportableProjects = projects.map(project => ({
        ...project,
        videoFiles: project.videoFiles.map(f => ({ name: f.name, type: f.type })),
        audioFiles: project.audioFiles.map(f => ({ name: f.name, type: f.type })),
    }));

    return JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        projects: exportableProjects,
    }, null, 2);
}

// Import data from JSON
export async function importData(jsonString) {
    const data = JSON.parse(jsonString);
    const db = await initDB();

    // Clear existing data
    const tx = db.transaction(PROJECTS_STORE, 'readwrite');
    await tx.store.clear();

    // Add imported projects
    for (const project of data.projects) {
        // Regenerate IDs to avoid conflicts
        const newProject = {
            ...project,
            id: generateId(),
            videoFiles: [],
            audioFiles: [],
            importedAt: new Date().toISOString(),
        };
        await tx.store.add(newProject);
    }

    await tx.done;
    return data.projects.length;
}

// Search projects
export async function searchProjects(query) {
    const projects = await getAllProjects();
    const lowerQuery = query.toLowerCase();
    return projects.filter(p =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
        p.script.toLowerCase().includes(lowerQuery) ||
        p.scenario.toLowerCase().includes(lowerQuery)
    );
}
