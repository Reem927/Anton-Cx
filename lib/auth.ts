// REPLACE WITH REAL AUTH — entire file is a test stub

/** REPLACE WITH REAL AUTH — swap for actual authenticated user ID */
export const TEST_USER_ID = "test-user-001";

/** REPLACE WITH REAL AUTH — swap getUser() for session/token lookup */
export function getUser() {
  return {
    id: TEST_USER_ID,
    email: "analyst@antoncx.com",
    name: "Test Analyst",
  };
}
