"use client";

import React, { useEffect, useState, useContext } from "react";
import { SupabaseContext } from "@/providers/supabase";
import Link from "next/link";

const ArchivedQuestions = () => {
  const { client } = useContext(SupabaseContext);
  const [questions, setQuestions] = useState<
    {
      id: any;
      created_at: any;
      question_id: any;
    }[]
  >([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await client
        .from("question")
        .select("id, created_at, question_id")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching questions:", error);
      } else {
        console.log("Fetched questions:", data);
        const archivedQuestions = data.slice(1);
        setQuestions(archivedQuestions);
      }
    };

    fetchQuestions();
  }, [client]);

  return (
    <div className="archived-questions-container">
      <h1>Archived Questions</h1>
      <ul className="archived-questions-list">
        {questions.map((question) => (
          <li key={question.question_id} className="archived-question-item">
            <Link
              href={`/archive/${question.question_id}`}
              className="archived-question-link"
            >
              <div className="archived-question-content">
                <span className="archived-question-title">
                  Quiz {question.question_id} -{" "}
                  {new Date(question.created_at).toLocaleDateString()}
                </span>
                <div className="attempts-indicator">
                  <div className="completed"></div>
                  <div></div>
                  <div></div>
                  <span className="attempts-text">0 attempts</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArchivedQuestions;
