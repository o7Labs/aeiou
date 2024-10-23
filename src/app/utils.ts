import { Feedback } from "./type";

export const getFeedbackColor = (
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

  export const calculateAEIOUScore = (
    attemptNumber: number,
    wordLength: number,
    won: boolean
  ) => {
    if (!won) return 0;
    const maxAttempts = 3;
    return (maxAttempts + 1 - attemptNumber) * wordLength;
  };

  export const calculateProbabilityScore = (guessPattern: Feedback) => {
    if (!guessPattern || guessPattern.length === 0) {
      return 0; // Return 0 if guessPattern is undefined or empty
    }

    const wordLength = guessPattern.length;
    const greens = guessPattern.filter((f) => f === "correct").length;
    const yellows = guessPattern.filter((f) => f === "wrong-position").length;
    const grays = guessPattern.filter((f) => f === "incorrect").length;

    return (greens * 1.0 + yellows * 0.5 + grays * 0.1) / wordLength;
  };

  const calculateBonusPoints = (wordLength: number) => {
    if (wordLength <= 5) return 0;
    return (wordLength - 5) * 2;
  };

  export const calculateScore = (question: any, attempts: any, feedback: Feedback[], timeElapsed: number) => {
    const wordLength = question?.answer.length || 0;
    const attemptNumber = attempts.length;
    const won = feedback.some((row) => row.every((f) => f === "correct"));

    // Ensure feedback for the current attempt is available
    const currentFeedback = feedback[attemptNumber - 1] || [];

    const baseScore = calculateAEIOUScore(attemptNumber, wordLength, won);
    const infoScore = calculateProbabilityScore(currentFeedback);
    const lengthBonus = calculateBonusPoints(wordLength);

    const totalScore = baseScore + infoScore * 10 + lengthBonus;
    return Math.max(Math.round(totalScore - timeElapsed), 0); // Round to nearest integer and ensure non-negative score
  };
