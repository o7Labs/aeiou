import { getFeedbackColor } from "@/app/utils";

interface IQuizAttempt {
  attempts: any[];
  feedback: any[][];
  spacedIndices: any[];
}

const QuizAttempt = ({ attempts, feedback, spacedIndices }: IQuizAttempt) => {
  return (
    <div>
      <div className="attempts-container">
        {attempts.map((attempt, index) => {
          // Copy trimmed attempt and insert spaces based on spacedIndices
          let untrimmedAttempt = attempt.split(""); // Trimmed version of the attempt
          spacedIndices.forEach((spaceIndex) => {
            untrimmedAttempt.splice(spaceIndex, 0, " "); // Insert spaces back into the attempt
          });

          let attemptIndex = 0; // Pointer for traversing the trimmed attempt
          return (
            <div key={index} className="attempt-row">
              {untrimmedAttempt.map((char: string, charIndex: number) =>
                char === " " ? (
                  <div key={charIndex} className="answer-space" /> // Render space where it originally existed
                ) : (
                  <div
                    key={charIndex}
                    className={`attempt-block ${getFeedbackColor(
                      feedback[index][attemptIndex] // Map the feedback from the trimmed version
                    )}`}
                  >
                    {attempt[attemptIndex++] || ""}{" "}
                    {/* Only move through non-space attempt characters */}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizAttempt;
