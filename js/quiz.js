document.addEventListener('DOMContentLoaded', () => {
  const saveQuizButton = document.getElementById('saveQuizButton');
  const quizQuestion = document.getElementById('quizQuestion');
  const quizAnswer1 = document.getElementById('quizAnswer1');
  const quizAnswer2 = document.getElementById('quizAnswer2');
  const quizAnswer3 = document.getElementById('quizAnswer3');
  const quizAnswer4 = document.getElementById('quizAnswer4');
  const quizMessage = document.getElementById('quizMessage');

  if (!saveQuizButton) return;

  async function loadQuiz() {
    try {
      const quiz = await fetchQuiz();
      quizQuestion.value = quiz.question || DEFAULT_QUIZ.question;
      const answers = quiz.answers || DEFAULT_QUIZ.answers;
      quizAnswer1.value = answers[0] || '';
      quizAnswer2.value = answers[1] || '';
      quizAnswer3.value = answers[2] || '';
      quizAnswer4.value = answers[3] || '';
    } catch (error) {
      quizMessage.textContent = 'Unable to load quiz settings.';
      console.error(error);
    }
  }

  saveQuizButton.addEventListener('click', async () => {
    quizMessage.textContent = '';
    const payload = {
      id: 1,
      question: quizQuestion.value.trim() || DEFAULT_QUIZ.question,
      answers: [
        quizAnswer1.value.trim() || DEFAULT_QUIZ.answers[0],
        quizAnswer2.value.trim() || DEFAULT_QUIZ.answers[1],
        quizAnswer3.value.trim() || DEFAULT_QUIZ.answers[2],
        quizAnswer4.value.trim() || DEFAULT_QUIZ.answers[3]
      ]
    };

    try {
      await upsertQuiz(payload);
      quizMessage.textContent = 'Quiz saved successfully.';
    } catch (error) {
      quizMessage.textContent = 'Unable to save quiz. Please try again.';
      console.error(error);
    }
  });

  loadQuiz();
});
