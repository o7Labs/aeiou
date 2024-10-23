"use client";

import { LayoutContext } from "@/providers/layout";
import { SupabaseContext } from "@/providers/supabase";
import { useRouter } from "next/navigation";
import React, { useContext, useState } from "react";

interface IPageLayout {
  children: React.ReactNode;
}
const PageLayout = ({ children }: IPageLayout) => {
  const router = useRouter();
  const { viewArchivedQuestions, setViewArchivedQuestions } =
    useContext(LayoutContext);
  const { client, user, isAuthenticated } = useContext(SupabaseContext);

  const handleSignIn = async () => {
    await client.auth.signInWithOAuth({ provider: "google" });
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 gap-10">
      <header className="flex justify-between items-center w-full">
        <div className="quix-header text-center">
          <h1 className="quix-title">AEIOU</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (viewArchivedQuestions) {
                setViewArchivedQuestions(!viewArchivedQuestions);
                router.push("/");
              } else {
                setViewArchivedQuestions(!viewArchivedQuestions);
                router.push("/archive");
              }
            }}
            className="archived-button"
          >
            {viewArchivedQuestions ? "Back to Quiz" : "View Archived Questions"}
          </button>
          {isAuthenticated ? (
            <div className="authenticated-box flex items-center gap-2">
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
        </div>
      </header>
      {children}
      <footer className="w-full flex items-center justify-center">
        Made with ❤️ by O7 Labs
      </footer>
    </main>
  );
};

export default PageLayout;
