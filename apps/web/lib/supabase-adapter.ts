import { createClient } from "@supabase/supabase-js";
import type { Adapter } from "next-auth/adapters";

export function SupabaseAdapter(url: string, secret: string): Adapter {
  const supabase = createClient(url, secret, {
    db: { schema: "public" },
    auth: { persistSession: false },
  });

  return {
    async createUser(user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { emailVerified, ...userWithoutEmailVerified } = user;
      const { data, error } = await supabase
        .from("users")
        .insert({
          ...userWithoutEmailVerified,
          email_verified: user.emailVerified,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, emailVerified: data.email_verified ? new Date(data.email_verified) : null };
    },
    async getUser(id) {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("id", id)
        .maybeSingle();

      if (error) return null;
      if (!data) return null;
      return { ...data, emailVerified: data.email_verified ? new Date(data.email_verified) : null };
    },
    async getUserByEmail(email) {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("email", email)
        .maybeSingle();

      if (error) return null;
      if (!data) return null;
      return { ...data, emailVerified: data.email_verified ? new Date(data.email_verified) : null };
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const { data, error } = await supabase
        .from("accounts")
        .select("users!inner(*)")
        .eq("provider", provider)
        .eq("provideraccountid", providerAccountId)
        .maybeSingle();

      if (error) return null;
      if (!data || !data.users) return null;

      const user = data.users as any;
      return { ...user, emailVerified: user.email_verified ? new Date(user.email_verified) : null };
    },
    async updateUser(user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { emailVerified, ...userWithoutEmailVerified } = user;
      const { data, error } = await supabase
        .from("users")
        .update({
          ...userWithoutEmailVerified,
          email_verified: user.emailVerified,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, emailVerified: data.email_verified ? new Date(data.email_verified) : null };
    },
    async deleteUser(userId) {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
    },
    async linkAccount(account) {
      console.log("Linking account:", account);
      // Postgres lowercases unquoted identifiers.
      // providerAccountId -> provideraccountid
      // userId -> userid
      const dbAccount = {
        userid: account.userId,
        type: account.type,
        provider: account.provider,
        provideraccountid: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      };

      const { error } = await supabase.from("accounts").insert(dbAccount);
      if (error) {
        console.error("Error linking account:", error);
        throw error;
      }
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("provider", provider)
        .eq("provideraccountid", providerAccountId);
      if (error) throw error;
    },
    async createSession(session) {
      const { data, error } = await supabase
        .from("sessions")
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        expires: new Date(data.expires),
      };
    },
    async getSessionAndUser(sessionToken) {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, users(*)")
        .eq("sessionToken", sessionToken)
        .maybeSingle();

      if (error || !data) return null;

      const user = data.users as any;
      return {
        session: {
          ...data,
          expires: new Date(data.expires),
        },
        user: { ...user, emailVerified: user.email_verified ? new Date(user.email_verified) : null },
      };
    },
    async updateSession(session) {
      const { data, error } = await supabase
        .from("sessions")
        .update(session)
        .eq("sessionToken", session.sessionToken)
        .select()
        .single();
      if (error) throw error;
      return data
        ? { ...data, expires: new Date(data.expires) }
        : null;
    },
    async deleteSession(sessionToken) {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("sessionToken", sessionToken);
      if (error) throw error;
    },
    async createVerificationToken(token) {
      const { data, error } = await supabase
        .from("verification_tokens")
        .insert(token)
        .select()
        .single();
      if (error) throw error;
      return { ...data, expires: new Date(data.expires) };
    },
    async useVerificationToken({ identifier, token }) {
      const { data, error } = await supabase
        .from("verification_tokens")
        .delete()
        .eq("identifier", identifier)
        .eq("token", token)
        .select()
        .maybeSingle();

      if (error) return null;
      return data ? { ...data, expires: new Date(data.expires) } : null;
    },
  };
}
