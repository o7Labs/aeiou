"use client";

import React, { useEffect, useState, useContext, useRef } from "react";
import { SupabaseContext } from "@/providers/supabase";
import { ChevronDown, Clock, Share2 } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import QuizAttempt from "../../../../components/quizAttempt";
import QuizInput from "../../../../components/quizInput";
import { calculateScore } from "@/app/utils";

type Feedback = ("correct" | "wrong-position" | "incorrect")[];

interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  image_url?: string;
  question_id: number;
}

const QuizPage: React.FC = () => {
  const { question_id: id } = useParams<{ question_id: string }>();
  const { client: supabase, user } = useContext(SupabaseContext);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const [score, setScore] = useState<number | null>(null);

  const [spacedIndices, setSpaceIndices] = useState<number[]>([]);
  const [answerLength, setAnswerLength] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchQuestion();
  }, [id, supabase]);

  useEffect(() => {
    if (gameState === "playing") {
      const timer = setInterval(() => {
        setTimeElapsed((prevTime) => prevTime + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  const fetchQuestion = async () => {
    const { data, error } = await supabase
      .from("question")
      .select("*")
      .eq("question_id", id)
      .single();

    if (error) {
      console.error("Error fetching question:", error);
    } else {
      const answer = data?.answer;
      const spacedIndices = answer
        .split("")
        .map((char: string, index: number) => (char === " " ? index : -1))
        .filter((index: number) => index !== -1);
      spacedIndices.sort((a: number, b: number) => a - b);
      setSpaceIndices(spacedIndices);
      setAnswerLength(answer.length);
      data.answer = data.answer.replace(/ /g, "");
      setQuestion(data);
    }
  };

  const handleCharacterChange = (index: number, value: string) => {
    const newAnswer = answer.split("");
    newAnswer[index] = value.toUpperCase();
    setAnswer(newAnswer.join(""));

    if (newAnswer.join("").length === question?.answer.length) {
      handleSubmit(newAnswer.join(""));
    }
  };

  const handleSubmit = (submittedAnswer: string) => {
    if (!question) return;

    while (submittedAnswer.length < question.answer.length) {
      submittedAnswer += " ";
    }

    const newFeedback: Feedback = submittedAnswer
      .split("")
      .map((char, index) => {
        if (char === " " && question.answer[index] === " ") {
          return "correct";
        } else if (char === question.answer[index]) {
          return "correct";
        } else if (question.answer.includes(char)) {
          return "wrong-position";
        } else {
          return "incorrect";
        }
      });

    setAttempts([...attempts, submittedAnswer]);
    setFeedback([...feedback, newFeedback]);

    if (submittedAnswer.trim() === question.answer || attempts.length === 2) {
      const calculatedScore = calculateScore(
        question,
        attempts,
        [newFeedback],
        timeElapsed
      );
      setScore(calculatedScore); // Store the score
      publishStats(calculatedScore);
      setGameState("finished");
      setShowExplanation(true);
    }

    setAnswer("");
    inputRefs.current[0]?.focus();
  };
  const publishStats = async (score: number) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const { error } = await supabase.from("archive_quiz_stats").insert([
      {
        user_id: user.id,
        quiz_id: question?.question_id,
        score: score,
      },
    ]);

    if (error) {
      console.error(
        "Error publishing stats:",
        error.message,
        error.details,
        error.hint
      );
    } else {
      console.log("Stats published successfully");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getFeedbackColor = (
    type: "correct" | "wrong-position" | "incorrect"
  ) => {
    switch (type) {
      case "correct":
        return "bg-green-500";
      case "wrong-position":
        return "bg-yellow-500";
      case "incorrect":
        return "bg-gray-300";
    }
  };

  if (!question) return <div>Loading...</div>;

  return (
    <div className="quix-container">
      <div className="w-full flex flex-row gap-10">
        <div className="w-full flex flex-col">
          <div className="w-full flex justify-center items-center flex-row mb-6">
            <div
              className="question-header"
              style={{
                padding: "4px 2px",
                width: "25%",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              Archived Question {question?.question_id}
            </div>
            {gameState === "finished" && score !== null && (
              <div className="mx-10">
                <h3>Your Score: {score}</h3>
              </div>
            )}
          </div>

          <div className="question-content">
            <p className={`${isQuestionExpanded ? "" : "line-clamp-2"}`}>
              {question.question}
            </p>
            {question.question.length > 100 && (
              <button
                className="expand-button"
                onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isQuestionExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
            {question.image_url && question.image_url !== "NULL" && (
              <div className="question-image">
                <Image
                  src={question.image_url}
                  alt="Question image"
                  width={0}
                  height={0}
                  layout="responsive"
                />
              </div>
            )}
          </div>
          <QuizAttempt
            attempts={attempts}
            feedback={feedback}
            spacedIndices={spacedIndices}
          />

          <QuizInput
            answer={answer}
            gameState={gameState}
            handleCharacterChange={handleCharacterChange}
            inputRefs={inputRefs}
            spacedIndices={spacedIndices}
            answerLength={answerLength}
          />
          <button
            className="submit-button"
            onClick={() => handleSubmit(answer)}
            disabled={gameState !== "playing"}
          >
            Submit
          </button>

          {showExplanation && (
            <div className="explanation">
              <h3>Answer Explanation:</h3>
              <p>{question?.explanation}</p>
              {question?.image_url && question.image_url !== "NULL" && (
                <div className="explanation-image">
                  <Image
                    src={question.image_url}
                    alt="Explanation image"
                    width={500}
                    height={300}
                    layout="responsive"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="footer">
        <div className="timer">
          <Clock className="w-4 h-4" />
          <span>
            {formatTime(gameState === "finished" ? timeElapsed : timeElapsed)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
