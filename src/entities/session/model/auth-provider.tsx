import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/shared/api";

import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth-context";

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const userIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    function applySession(nextSession: Session | null) {
      const nextUserId = nextSession?.user.id ?? null;

      if (userIdRef.current !== undefined && userIdRef.current !== nextUserId) {
        queryClient.clear();
      }

      userIdRef.current = nextUserId;
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "anonymous");
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      applySession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, signOut, status, user: session?.user ?? null }),
    [session, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
