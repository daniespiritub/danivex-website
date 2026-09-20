# Backup and recovery

Baseline production: dpl_CSirmPjGekxCkMcj1mj1AMLNiJB3,
https://danivex-website-bvhtbxd9e-daniespiritubs-projects.vercel.app .
This is the known pre-platform deployment, not an account database backup.

Before account activation configure provider backups/PITR appropriate to the chosen
plan. No hosted account DB exists in available configuration, so no real DB backup
or restore has been performed. Never claim the SQL test is a backup.

Migration is additive, transactional and reviewed/tested locally. Apply once to
staging, verify schema/roles/constraints, export a secure provider backup before
production changes and test restoring to an isolated project. Do not place dumps or
credentials in Git or public assets. Record RPO/RTO based on the actual plan.

Application rollback: Vercel `rollback` to the previous Ready deployment, then test
home/Scanner/assets. Disable features if migration/credentials are incomplete.
Application rollback does not undo database writes. Retain additive tables until
forward repair; never drop them automatically to roll back UI.
