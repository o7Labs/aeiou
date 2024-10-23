"use client";
import { useContext, useEffect, useState } from "react";
import QuizGame from "../../components/QuizGame";
import { SupabaseContext } from "@/providers/supabase";
import Leaderboard from "../../components/Leaderboard"; // Ensure this path is correct
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const { client, user } = useContext(SupabaseContext);
  const [hasPlayed, setHasPlayed] = useState(false);

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
    <div className="flex w-full">
      <div className="flex-1">
        {!hasPlayed ? (
          <QuizGame />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              You have already played today. Please come back tomorrow.
            </h2>
          </div>
        )}
      </div>
      <div className="w-1/4">
        <Leaderboard />
      </div>
    </div>
  );
}
