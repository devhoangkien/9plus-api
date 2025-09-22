/**
 * Verify a password against a password hash.
 *
 * @param password - The password to verify.
 * @param passwordHash - The password hash to compare against.
 * @returns `true` if the password is valid, `false` otherwise.
 */
export function verifyPassword(password: string, passwordHash: string) {
  return Bun.password.verify(password, passwordHash);
}

/**
 * Hash a password using the bcrypt algorithm.
 *
 * @param password - The password to hash.
 * @returns The hashed password.
 */
export function hashPassword(password: string) {
  return Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10, // Number between 4-31
  });
}
