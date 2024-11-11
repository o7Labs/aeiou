"use client";
import { useState, useEffect, useRef, useContext, use } from "react";
import { ChevronDown, Clock, Share2 } from "lucide-react";
import Image from "next/image";
import { SupabaseContext } from "@/providers/supabase";
import QuizAttempt from "./quizAttempt";
import QuizInput from "./quizInput";
import { calculateScore } from "@/app/utils";
import { Feedback } from "@/app/type";

interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  image_url?: string;
  question_id: number;
  answer_url?: string;
}

export default function QuizGame() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [stats, setStats] = useState({
    played: 0,
    winPercentage: 0,
    currentStreak: 0,
    maxStreak: 0,
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);

  const [spacedIndices, setSpaceIndices] = useState<number[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [answerLength, setAnswerLength] = useState(0);

  const answerInputRef = useRef<HTMLInputElement>(null);
  const {
    client: supabase,
    isAuthenticated,
    user,
  } = useContext(SupabaseContext);

  useEffect(() => {
    fetchQuestion();
    fetchStats();
  }, []);
  const [finalTime, setFinalTime] = useState(0);
  useEffect(() => {
    if (gameState === "playing") {
      const timer = setInterval(() => {
        setTimeElapsed((prevTime) => prevTime + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // const fetchQuestion = async () => {
  //   const { data, error } = await supabase
  //     .from("question")
  //     .select("*")
  //     .order("created_at", { ascending: false })
  //     .limit(1)
  //     .single();

  //   if (error) {
  //     console.error("Error fetching question:", error);
  //   } else if (data) {
  //     const answer = data?.answer;
  //     const spacedIndices = answer
  //       .split("")
  //       .map((char: string, index: number) => (char === " " ? index : -1))
  //       .filter((index: number) => index !== -1);
  //     spacedIndices.sort((a: number, b: number) => a - b);
  //     setSpaceIndices(spacedIndices);
  //     setAnswerLength(answer.length);
  //     data.answer = data.answer.replace(/ /g, "");
  //     setQuestion(data);
  //   }
  // };

  // ... existing code ...

const fetchQuestion = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of the day

  const { data, error } = await supabase
    .from("question")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching question:", error);
  } else if (data) {
    // Find today's question
    const todaysQuestion = data.find((question) => {
      const questionDate = new Date(question.created_at);
      questionDate.setHours(0, 0, 0, 0);
      return questionDate.getTime() === today.getTime();
    });

    const selectedQuestion = todaysQuestion || data[0]; // Use today's question or the latest one

    const answer = selectedQuestion.answer;
    const spacedIndices = answer
      .split("")
      .map((char: string, index: number) => (char === " " ? index : -1))
      .filter((index: number) => index !== -1);
    spacedIndices.sort((a: number, b: number) => a - b);
    setSpaceIndices(spacedIndices);
    setAnswerLength(answer.length);
    selectedQuestion.answer = selectedQuestion.answer.replace(/ /g, "");
    setQuestion(selectedQuestion);
  }
};



  useEffect(() => {
    if (showExplanation && !isAuthenticated) {
      alert("You need to be signed in to view the explanation");
    }
  }, [showExplanation]);

  const publishStats = async (score: number) => {
    await supabase.from("quiz_stats").insert([
      {
        user_id: user?.id,
        quiz_id: question?.id,
        score: score,
      },
    ]);
  };

  useEffect(() => {
    const fetchRealStats = async () => {
      if (gameState === "finished") {
        await fetchStats();
      }
    };
    fetchRealStats();
  }, [gameState]);

  const getStats = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("quiz_stats")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching stats:", error);
    } else if (data) {
      return data;
    }
  };
  const fetchStats = async () => {
    const data = await getStats();
    if (data && data.length > 0) {
      const totalPlayed = data.length;
      const wins = data.filter((stat) => stat.score > 0).length;
      const winPercentage = (wins / totalPlayed) * 100;
  
      let currentStreak = 0;
      let maxStreak = 0;
      let streak = 1;
  
      data.forEach((stat, index) => {
        if (stat.score > 0) {
          if (index === 0) {
            streak = 1;
          } else {
            const prevCreatedAt = new Date(data[index - 1].created_at);
            const currentCreatedAt = new Date(stat.created_at);
            const diff = (currentCreatedAt.getTime() - prevCreatedAt.getTime()) / 1000;
  
            if (diff <= 24 * 60 * 60) {
              streak += 1;
            } else {
              streak = 1;
            }
          }
          if (streak > maxStreak) {
            maxStreak = streak;
          }
        } else {
          streak = 1; // Reset streak on a loss
        }
      });
  
      currentStreak = streak; // The last calculated streak is the current streak
  
      setStats({
        played: totalPlayed,
        winPercentage: winPercentage,
        currentStreak: currentStreak,
        maxStreak: maxStreak,
      });
    } else {
      setStats({
        played: 0,
        winPercentage: 0,
        currentStreak: 1,
        maxStreak: 0,
      });
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

  // ... existing code ...

const handleSubmit = (submittedAnswer: string) => {
  if (!question) return;

  // Ensure the submitted answer matches the length of the correct answer
  // Pad the submitted answer with spaces if it's shorter
  while (submittedAnswer.length < question.answer.length) {
    submittedAnswer += " ";
  }

  // Generate feedback for each character
  const newFeedback: Feedback = submittedAnswer
    .split("")
    .map((char, index) => {
      if (char === " " && question.answer[index] === " ") {
        return "correct"; // Correct space at the correct position
      } else if (char === question.answer[index]) {
        return "correct"; // Correct character at the correct position
      } else if (question.answer.includes(char)) {
        return "wrong-position"; // Correct character but at the wrong position
      } else {
        return "incorrect"; // Incorrect character
      }
    });


  setAttempts([...attempts, submittedAnswer]);
  setFeedback([...feedback, newFeedback]);

  // Check if the game should end
  if (submittedAnswer.trim() === question.answer || attempts.length === 2) {
    const score = calculateScore(
      question,
      attempts,
      [newFeedback],
      timeElapsed
    );

    publishStats(score)
      .then(() => {
        setGameState("finished");
        setFinalTime(timeElapsed);
        setShowExplanation(true);

        // Update the leaderboard with the new score
        updateLeaderboard(user?.id, score);
      })
      .catch((error) => {
        console.error("Error publishing stats:", error);
      })
      .finally(() => {
        setTimeElapsed(0);
      });

    fetchStats();
  }

  setAnswer(""); // Clear current answer for the next input
  inputRefs.current[0]?.focus();
};

const updateLeaderboard = async (userId: string | undefined, score: number) => {
  if (!userId) return;

  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('total_score')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching current leaderboard score:', error);
    return;
  }

  const newTotalScore = (data?.total_score || 0) + score;

  const { error: updateError } = await supabase
    .from('leaderboard_view')
    .upsert({ user_id: userId, total_score: newTotalScore }, { onConflict: 'user_id' });

  if (updateError) {
    console.error('Error updating leaderboard score:', updateError);
  } else {
    console.log(`Leaderboard updated for user ID ${userId} with new score ${newTotalScore}`);
  }
};


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getShareableResult = () => {
    const score = calculateScore(question, attempts, feedback, timeElapsed);
    const feedbackEmojis = feedback
      .map((row) =>
        row
          .map((f: any) =>
            f === "correct" ? "🟩" : f === "wrong-position" ? "🟨" : "⬛"
          )
          .join("")
      )
      .join("\n");

    // Find the attempt where the user got the correct answer
    const correctAttemptIndex =
      attempts.findIndex((attempt) => attempt === question?.answer) + 1;

    return `AEIOU #${question?.question_id}\n${
      correctAttemptIndex > 0 ? `${correctAttemptIndex}/3` : `X/3`
    } Score: ${score}\n${feedbackEmojis}\n\nPlay at: https://playaeiou.vercel.app/`;
  };
  const [showToast, setShowToast] = useState(false);

  const handleCopy = async () => {
    const result = getShareableResult(); // Assuming this function returns the string to copy
    await navigator.clipboard.writeText(result);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // Toast disappears after 3 seconds
  };

  if (!question) return <div>Loading...</div>;

  return (
    <div className="quix-container">
      <div className="w-full flex flex-row gap-10">
        <div className="w-full flex flex-col">
          <div
            className="question-header"
            style={{
              zIndex: 100,
              transform: "translateX(-50%)",
              left: "50%",
              position: "relative",
              bottom: "12px",
              padding: "4px 2px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Question of the day
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
                  width={100} // Set the original width of the image
                  height={100} // Set the original height of the image
                  layout="responsive"
                  style={{ width: "100%", height: "100%" }}
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

          {showExplanation && isAuthenticated && (
            <div className="explanation">
              <h3>Answer Explanation:</h3>
              <p>{question?.explanation}</p>
              {question?.answer_url && question.answer_url !== "NULL" && (
                <div className="question-image">
                  <Image
                    src={question.answer_url}
                    alt="Explanation image"
                    width={100} // Set the original width of the image
                    height={100} // Set the original height of the image
                    layout="responsive"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {gameState === "finished" && isAuthenticated && (
          <div className="w-1/2">
            <div className="statistics-panel">
              <h3 className="text-center text-2xl font-bold mb-4">
                Statistics
              </h3>
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-value">{stats.played}</div>
                  <div className="stat-label">Played</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{stats.winPercentage}%</div>
                  <div className="stat-label">Win %</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{stats.currentStreak}</div>
                  <div className="stat-label">Current Streak</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{stats.maxStreak}</div>
                  <div className="stat-label">Max Streak</div>
                </div>
              </div>
              <div className="stat">
                <div className="stat-value">
                  {formatTime(
                    gameState === "finished" ? finalTime : timeElapsed
                  )}
                </div>
                <div className="stat-label">Time Taken</div>
              </div>
              <div className="shareable-result">
                <h4>Result:</h4>
                <pre className="result-text">{getShareableResult()}</pre>
              </div>

              <button className="copy-button" onClick={handleCopy}>
                Copy
              </button>
              {/* <button className="explore-button">Explore previous QOTD</button> */}
            </div>
          </div>
        )}
      </div>
      {showToast && <div className="toast">Copied to clipboard!</div>}
      <div className="footer">
        <div className="timer">
          <Clock className="w-4 h-4" />
          <span>
            {formatTime(gameState === "finished" ? finalTime : timeElapsed)}
          </span>
        </div>
      </div>
    </div>
  );
}
