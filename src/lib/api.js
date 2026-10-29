import { supabase } from './supabase';

// Todas las funciones asumen que isBackendConfigured === true.
// La UI las llama solo en ese caso.

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// ---------- Persona mayor (anónima, sin login visible) ----------

export async function ensureElderSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

export async function getMyProfile() {
  const user = await currentUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(patch) {
  const user = await currentUser();
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createRun({ procedureId, institutionId, totalSteps }) {
  const user = await currentUser();
  const { data, error } = await supabase
    .from('procedure_runs')
    .insert({
      user_id: user.id,
      procedure_id: procedureId,
      institution_id: institutionId,
      total_steps: totalSteps,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRun(runId, patch) {
  const { error } = await supabase.from('procedure_runs').update(patch).eq('id', runId);
  if (error) throw error;
}

export async function requestHelp({ runId, step }) {
  const user = await currentUser();
  const { error } = await supabase
    .from('help_requests')
    .insert({ user_id: user.id, run_id: runId, step });
  if (error) throw error;
}

export async function redeemInvite(code) {
  const { data, error } = await supabase.rpc('redeem_invite', { p_code: code });
  if (error) throw error;
  return data; // nombre del familiar
}

// ---------- Familiar (Google) ----------

export async function signInFamilyWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/familia` },
  });
  if (error) throw error;
}

export async function signOutAll() {
  await supabase.auth.signOut();
}

export async function becomeFamily() {
  const { error } = await supabase.rpc('become_family');
  if (error) throw error;
}

export async function createInviteCode() {
  const { data, error } = await supabase.rpc('create_invite');
  if (error) throw error;
  return data;
}

export async function getFamilyOverview() {
  const { data: links, error: linksError } = await supabase
    .from('links')
    .select('elder_id, created_at');
  if (linksError) throw linksError;

  const elderIds = links.map((l) => l.elder_id);
  if (elderIds.length === 0) return [];

  const [profilesRes, runsRes, helpRes] = await Promise.all([
    supabase.from('profiles').select('id, display_name').in('id', elderIds),
    supabase.from('procedure_runs').select('*').in('user_id', elderIds).order('started_at', { ascending: false }),
    supabase.from('help_requests').select('*').in('user_id', elderIds).eq('status', 'open').order('created_at', { ascending: false }),
  ]);
  for (const r of [profilesRes, runsRes, helpRes]) if (r.error) throw r.error;

  return elderIds.map((id) => ({
    id,
    name: profilesRes.data.find((p) => p.id === id)?.display_name || 'Sin nombre',
    runs: runsRes.data.filter((r) => r.user_id === id),
    openHelp: helpRes.data.filter((h) => h.user_id === id),
  }));
}

export async function resolveHelp(helpId) {
  const { error } = await supabase
    .from('help_requests')
    .update({ status: 'resolved' })
    .eq('id', helpId);
  if (error) throw error;
}
