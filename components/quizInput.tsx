interface IQuizInput {
  answer: any;
  handleCharacterChange: (index: number, value: string) => void;
  gameState: string;
  spacedIndices: any[];
  inputRefs: any;
  answerLength: number;
}
const QuizInput = ({
  answer,
  handleCharacterChange,
  gameState,
  spacedIndices,
  inputRefs,
  answerLength,
}: IQuizInput) => {
  return (
    <div>
      <div className="answer-container">
        {Array.from({ length: answerLength }).map((_, index) => {
          const isSpace = spacedIndices.includes(index);
          const normalizedIndex =
            index - spacedIndices.filter((si: number) => si < index).length;

          return isSpace ? (
            <div key={index} className="answer-space" />
          ) : (
            <input
              key={index}
              // @ts-ignore
              ref={(el) => (inputRefs.current[normalizedIndex] = el)}
              className="answer-input"
              maxLength={1}
              value={answer[normalizedIndex] || ""}
              onChange={(event) => {
                handleCharacterChange(normalizedIndex, event.target.value);

                // Move focus to the next input, skipping over spaces
                let nextInputIndex = index + 1;
                while (spacedIndices.includes(nextInputIndex)) {
                  nextInputIndex++;
                }

                if (nextInputIndex < answerLength) {
                  const nextNormalizedIndex =
                    nextInputIndex -
                    spacedIndices.filter((si) => si < nextInputIndex).length;
                  inputRefs.current[nextNormalizedIndex]?.focus();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace") {
                  event.preventDefault(); // Prevent default backspace behavior

                  // Handle backspace to move to the previous input, skipping spaces
                  let prevInputIndex = index - 1;
                  while (spacedIndices.includes(prevInputIndex)) {
                    prevInputIndex--;
                  }

                  if (prevInputIndex >= 0) {
                    const prevNormalizedIndex =
                      prevInputIndex -
                      spacedIndices.filter((si) => si < prevInputIndex).length;
                    inputRefs.current[prevNormalizedIndex]?.focus();
                    handleCharacterChange(prevNormalizedIndex, ""); // Clear the previous input if needed
                  }
                }
              }}
              disabled={gameState !== "playing"}
            />
          );
        })}
      </div>
    </div>
  );
};

export default QuizInput;
