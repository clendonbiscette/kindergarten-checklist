// Session Storage Utilities for Teacher Workflow
// Saves and restores teacher's last session to reduce repetitive dropdown selections

const SESSION_KEY = 'teacher_session';
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Save current session to localStorage
 * @param {Object} session - Session data to save
 */
export const saveSession = (session) => {
  try {
    const sessionData = {
      ...session,
      timestamp: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

/**
 * Retrieve saved session from localStorage
 * @returns {Object|null} - Saved session or null if expired/not found
 */
export const getSession = () => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);

    // Check if session has expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error retrieving session:', error);
    return null;
  }
};

/**
 * Clear saved session
 */
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

/**
 * Update specific session fields
 * @param {Object} updates - Fields to update
 */
export const updateSession = (updates) => {
  const currentSession = getSession() || {};
  saveSession({ ...currentSession, ...updates });
};

/**
 * Get specific session field
 * @param {string} key - Field name
 * @returns {any} - Field value or null
 */
export const getSessionField = (key) => {
  const session = getSession();
  return session ? session[key] : null;
};
