import { vi } from "vitest";

const app = { name: "mock-app" };
let initialized = false;

const auth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
};

const remoteConfig = {
  settings: {},
  defaultConfig: {},
};

// Mock Firestore data and functions - must be defined as function to avoid hoisting issues
const createMockFirestore = () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    // Call callback immediately with empty snapshot
    if (typeof query === 'function') {
      // If first arg is callback (doc listener)
      query({ exists: () => false, data: () => null });
    } else if (callback) {
      // If second arg is callback (collection listener)
      callback({
        docs: [],
        empty: true,
        forEach: vi.fn(),
        size: 0,
      });
    }
    // Return unsubscribe function
    return vi.fn();
  }),
});

const mockFirestore = createMockFirestore();

export const firebaseMocks = {
  auth,
  remoteConfig,
  firestore: mockFirestore,
};

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => {
    initialized = true;
    return app;
  }),
  getApps: vi.fn(() => (initialized ? [app] : [])),
  getApp: vi.fn(() => app),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => auth),
  GoogleAuthProvider: vi.fn(() => ({
    setCustomParameters: vi.fn(),
  })),
  signInWithPopup: auth.signInWithPopup,
  signInWithRedirect: auth.signInWithRedirect,
  signOut: auth.signOut,
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Immediately call with null user
    callback(null);
    // Return unsubscribe function
    return vi.fn();
  }),
  updateProfile: vi.fn(),
}));

vi.mock("firebase/remote-config", () => ({
  getRemoteConfig: vi.fn(() => remoteConfig),
  fetchAndActivate: vi.fn(async () => true),
  getValue: vi.fn(() => ({
    asString: () => "false",
    asBoolean: () => false,
    asNumber: () => 0,
  })),
}));

// Mock Firestore module
vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => mockFirestore),
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({
    docs: [],
    empty: true,
    forEach: vi.fn(),
    size: 0,
  })),
  getDoc: vi.fn(async () => ({
    exists: () => false,
    data: () => null,
    id: "mock-id",
  })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
  addDoc: vi.fn(async () => ({ id: "mock-id" })),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  onSnapshot: mockFirestore.onSnapshot,
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => ({ toDate: () => date })),
  },
}));
