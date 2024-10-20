"use client";
import { useContext, useEffect, useState } from "react";
import QuizGame from "../../components/QuizGame";
import { SupabaseContext } from "@/providers/supabase";

export default function Home() {
  const { client, isAuthenticated, user } = useContext(SupabaseContext);
  const [hasPlayed, setHasPlayed] = useState(false);
  const handleSignIn = async () => {
    await client.auth.signInWithOAuth({ provider: "google" });
  };

  useEffect(() => {
    const checkIfPlayedToday = async () => {
      const hasPlayed = await hasPlayedToday();
      setHasPlayed(hasPlayed === true);
    };
    checkIfPlayedToday();
  }, [user, client]);

  const hasPlayedToday = async () => {
    if (!user?.id) return;
    const { data, error } = await client
      .from("quiz_stats")
      .select("created_at")
      .eq("user_id", user?.id)
      .gte("created_at", new Date().toISOString().split("T")[0]);

    if (error) {
      console.error("Error fetching quiz stats", error);
      return false;
    }

    return data.length > 0;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 gap-10">
      <header className="flex justify-between items-center justify-between w-full">
        <div className="quix-header text-center">
          <h1 className="quix-title">AEIOU</h1>
        </div>
        {isAuthenticated ? (
          <div className="authenticated-box">
            <img
              src={user?.user_metadata?.avatar_url}
              alt="User avatar"
              className="w-10 h-10 rounded-full"
            />
            <span className="text-gray-800 font-semibold">
              Welcome, {user?.user_metadata?.name}
            </span>
          </div>
        ) : (
          <button onClick={handleSignIn} className="signin-button">
            Sign in with Google
          </button>
        )}
      </header>
      {!hasPlayed ? (
        <QuizGame />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            You have already played today. Please come back tomorrow.
          </h2>
        </div>
      )}
      <footer className="w-full flex items-center justify-center">
        Made with ❤️ by O7 Labs
      </footer>
    </main>
  );
}
