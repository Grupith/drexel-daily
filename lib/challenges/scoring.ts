export function scoreAnswers(answers: number[], correctAnswers: number[]) {
  const correctCount = answers.reduce(
    (count, answer, index) => count + Number(answer === correctAnswers[index]),
    0,
  );
  return { correctCount, pointsEarned: correctCount * 10 };
}
