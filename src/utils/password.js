import bcrypt from 'bcryptjs';

// Cost factor 12 balances hashing latency (~150-250ms on typical hardware)
// against resistance to offline brute-force; revisit as hardware improves.
const SALT_ROUNDS = 12;

export async function hashPassword(plainTextPassword) {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function comparePassword(plainTextPassword, hashedPassword) {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}
