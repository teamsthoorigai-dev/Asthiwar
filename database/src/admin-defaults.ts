/**
 * The password the seed gives the first admin account when ADMIN_SEED_PASSWORD
 * is not set.
 *
 * This repository is public, so this value is not a secret — anyone can read it,
 * and the email beside it. It exists so a local database is usable straight
 * after seeding. Production signs in on it only to change it — every other admin
 * request is refused until then — and the seed replaces it on any account still
 * using it once ADMIN_SEED_PASSWORD is configured.
 */
export const PUBLISHED_DEFAULT_ADMIN_PASSWORD = 'ChangeMe@2026!';
