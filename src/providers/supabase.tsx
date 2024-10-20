"use client";

import {
  SupabaseClient,
  createClient,
  Session,
  User,
} from "@supabase/supabase-js";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";

interface ISupaBaseContext {
  client: SupabaseClient<any, "public", any>;
  isAuthenticated: boolean;
  user: User | undefined;
  session: Session | undefined;
}
export const SupabaseContext = createContext<ISupaBaseContext>({
  client: {} as SupabaseClient<any, "public", any>,
  isAuthenticated: false,
  user: undefined,
  session: undefined,
});

interface ISupabaseProviderProps {
  children: React.ReactNode;
}

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY as string
);

export const SupabaseProvider = ({ children }: ISupabaseProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const getAuthSession = async () => {
    const session = await client.auth.getSession();
    return session?.data?.session ?? undefined;
  };

  useEffect(() => {
    const checkUserAuthStatus = async () => {
      const session = await getAuthSession();
      setSession(session);
      if (session) {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
      }
    };
    checkUserAuthStatus();
  }, []);

  const value: ISupaBaseContext = {
    client,
    isAuthenticated,
    user: currentUser,
    session,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};
