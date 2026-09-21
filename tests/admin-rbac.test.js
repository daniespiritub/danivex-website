import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' // first super_admin
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' // promoted to admin
const C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' // second super_admin

// Real Postgres via PGlite: applies every migration and exercises the RBAC guarantees
// exactly as they run in production (auth.uid()/session gated, SECURITY DEFINER guards).
test('admin RBAC: role gating, escalation prevention, last-super-admin, audit', async () => {
  const db = new PGlite()
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text, created_at timestamptz not null default now());
      create table auth.sessions(id uuid primary key, user_id uuid references auth.users(id) on delete cascade, not_after timestamptz);
      create table auth.identities(user_id uuid references auth.users(id) on delete cascade, provider text, primary key(user_id, provider));
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('session_id',current_setting('request.jwt.claim.session_id',true))$$;
      grant usage on schema auth,public to anon,authenticated;
      grant execute on function auth.uid(),auth.jwt() to anon,authenticated;`)
    const dir = new URL('../supabase/migrations/', import.meta.url)
    for (const file of (await readdir(dir)).filter((n) => n.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, dir), 'utf8'))

    await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6)', [A, 'admin@danivex.com', B, 'b@danivex.com', C, 'c@danivex.com'])
    await db.query('insert into auth.sessions(id,user_id) values ($1,$1),($2,$2),($3,$3)', [A, B, C])
    await db.query("insert into auth.identities(user_id,provider) values ($1,'google'),($2,'email'),($3,'email')", [A, B, C])

    const asUser = async (id) => {
      await db.exec('reset role; set role authenticated;')
      await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.session_id',$1,false)", [id])
    }
    const role = async () => (await db.query('select public.dv_current_role() as r')).rows[0].r

    // Default role is 'user' (created by the dv_create_role trigger / backfill).
    await asUser(B); assert.equal(await role(), 'user')

    // Bootstrap A as the first super_admin through the controlled procedure.
    await db.exec('reset role;')
    const boot = (await db.query("select public.dv_bootstrap_super_admin('admin@danivex.com') as r")).rows[0].r
    assert.equal(boot.ok, true); assert.equal(boot.role, 'super_admin')
    await asUser(A); assert.equal(await role(), 'super_admin')

    // A normal user cannot reach any admin surface.
    await asUser(B)
    for (const fn of ['select public.dv_admin_metrics()', 'select * from public.dv_admin_users()', 'select * from public.dv_admin_audit_list()'])
      await assert.rejects(db.query(fn), /forbidden/, fn)
    // Privilege escalation via direct table write is impossible (no grant + RLS).
    await assert.rejects(db.query("update public.dv_user_roles set role='super_admin' where user_id=$1", [B]), /permission denied/)
    await assert.rejects(db.query("insert into public.dv_user_roles(user_id,role) values ($1,'super_admin')", [B]), /permission denied|row-level security/)

    // super_admin sees real metrics and the user list.
    await asUser(A)
    const metrics = (await db.query('select public.dv_admin_metrics() as m')).rows[0].m
    assert.equal(metrics.users_total, 3)
    assert.equal(metrics.super_admins, 1)
    assert.ok(metrics.google_accounts >= 1)
    const users = (await db.query('select * from public.dv_admin_users()')).rows
    assert.equal(users.length, 3)
    assert.ok(users.every((u) => 'email' in u && 'role' in u && !('password' in u)))

    // super_admin promotes B to admin → succeeds and is audited.
    const promo = (await db.query("select public.dv_admin_set_role($1,'admin') as r", [B])).rows[0].r
    assert.equal(promo.ok, true); assert.equal(promo.role, 'admin')

    // B is now admin: can read metrics, but CANNOT change roles (super_admin only).
    await asUser(B)
    assert.equal(await role(), 'admin')
    assert.ok((await db.query('select public.dv_admin_metrics() as m')).rows[0].m.users_total === 3)
    await assert.rejects(db.query("select public.dv_admin_set_role($1,'admin')", [C]), /forbidden/)

    // Last-super-admin protection: A cannot demote itself while it is the only one.
    await asUser(A)
    await assert.rejects(db.query("select public.dv_admin_set_role($1,'user')", [A]), /last_super_admin/)
    // Promote C to super_admin, THEN A may step down.
    assert.equal((await db.query("select public.dv_admin_set_role($1,'super_admin') as r", [C])).rows[0].r.role, 'super_admin')
    assert.equal((await db.query("select public.dv_admin_set_role($1,'user') as r", [A])).rows[0].r.role, 'user')
    // A is no longer privileged.
    await asUser(A)
    await assert.rejects(db.query('select public.dv_admin_metrics()'), /forbidden/)

    // Invalid role and unknown target are rejected.
    await asUser(C)
    await assert.rejects(db.query("select public.dv_admin_set_role($1,'root')", [B]), /invalid_role/)
    await assert.rejects(db.query("select public.dv_admin_set_role('00000000-0000-4000-8000-000000000000','admin')"), /user_not_found/)

    // Audit trail captured the sensitive actions with actor + target, no secrets.
    const audit = (await db.query('select * from public.dv_admin_audit_list()')).rows
    const actions = audit.map((r) => r.action)
    assert.ok(actions.includes('admin.role.promoted'))
    assert.ok(actions.includes('admin.role.demoted'))
    assert.ok(audit.every((r) => r.actor_email && typeof r.metadata === 'object'))
    assert.doesNotMatch(JSON.stringify(audit), /password|secret|token|service_role/i)

    // anon is fully locked out of every admin function.
    await db.exec('reset role; set role anon;')
    for (const fn of ['select public.dv_current_role()', 'select public.dv_admin_metrics()', 'select public.dv_admin_set_role($1,$2)'])
      await assert.rejects(db.query(fn, fn.includes('$1') ? [B, 'admin'] : []), /permission denied/)
  } finally { await db.close() }
})
