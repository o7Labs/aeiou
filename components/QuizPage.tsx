import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SupabaseContext } from "@/providers/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronDown, Clock, Share2 } from "lucide-react";
import Image from "next/image";

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
  const { id } = useParams<{ id: string }>();
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
      .from('question')
      .select('*')
      .eq('question_id', id)
      .single();

    if (error) {
      console.error('Error fetching question:', error);
    } else {
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
  
    const newFeedback: Feedback = submittedAnswer.split("").map((char, index) => {
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
      const calculatedScore = calculateScore([newFeedback], timeElapsed);
      setScore(calculatedScore); // Store the score
      publishStats(calculatedScore);
      setGameState("finished");
      setShowExplanation(true);
    }
  
    setAnswer("");
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
      console.error("Error publishing stats:", error.message, error.details, error.hint);
    } else {
      console.log("Stats published successfully");
    }
  };

  const calculateScore = (feedback: Feedback[], timeElapsed: number) => {
    let score = 0;
    feedback.forEach((row) => {
      row.forEach((f) => {
        if (f === "correct") score += 100;
        else if (f === "wrong-position") score -= 50;
        else if (f === "incorrect") score -= 25;
      });
    });
    score -= timeElapsed;
    return Math.max(score, 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getFeedbackColor = (type: "correct" | "wrong-position" | "incorrect") => {
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
          <div className="w-full flex flex-col">
          <div className="question-header" style={{ zIndex: 100, transform: 'translateX(-50%)', left: '50%', position: 'relative', bottom: '12px', padding: '4px 2px', width: '25%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            Archived Question {question?.question_id}
            </div>
            {gameState === "finished" && score !== null && (
  <div className="score-display">
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
                  className={`w-4 h-4 transition-transform ${isQuestionExpanded ? "rotate-180" : ""}`}
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
          <div className="attempts-container">
            {attempts.map((attempt, index) => (
              <div key={index} className="attempt-row">
                {attempt.split("").map((char, charIndex) => (
                  char === " " ? (
                    <div key={charIndex} className="attempt-space" />
                  ) : (
                    <div key={charIndex} className={`attempt-block ${getFeedbackColor(feedback[index][charIndex])}`}>
                      {char}
                    </div>
                  )
                ))}
              </div>
            ))}
          </div>
          <div className="answer-container">
            {question.answer.split("").map((char, index) =>
              char === " " ? (
                <div key={index} className="answer-space" />
              ) : (
                <input
                  key={index}
                  className="answer-input"
                  maxLength={1}
                  value={answer[index] || ""}
                  onChange={(event) => handleCharacterChange(index, event.target.value)}
                  disabled={gameState !== "playing"}
                />
              )
            )}
          </div>
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
          <span>{formatTime(gameState === "finished" ? timeElapsed : timeElapsed)}</span>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;