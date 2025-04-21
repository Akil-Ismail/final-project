async function getQuizNames() {
  try {
    const response = await fetch("./backend/interactions/getQuizNames.php");
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    } else {
      return result.error;
    }
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return error;
  }
}

async function renderQuizNames() {
  const container = document.getElementById("quizes");
  const loader = document.createElement("div");
  loader.innerHTML = `<div class="loader"></div>`;
  container.appendChild(loader);

  const quizes = await getQuizNames();

  if (Array.isArray(quizes)) {
    container.innerHTML = null;
    quizes.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.innerHTML = `
          <a href="quiz.html?id=${item.id}">
            <button class="choose-quiz">${item.name}</button>
          </a>`;
      container.appendChild(itemDiv);
    });
  } else {
    alert("Error fetching quizzes");
    console.error("Error fetching quizzes:", quizes);
  }
}

async function renderQuiz() {
  const user_id = localStorage.getItem("user_id");
  const container = document.getElementById("quiz");
  const loader = document.createElement("div");
  loader.innerHTML = `<div class="loader"></div>`;
  container.appendChild(loader);

  const params = new URLSearchParams(window.location.search);
  const quiz_id = params.get("id");

  if (!quiz_id) {
    container.innerHTML = "<p>No quiz ID found in the URL.</p>";
    return;
  }

  try {
    const response = await fetch(
      `./backend/interactions/getQuizContent.php?quiz_id=${quiz_id}&user_id=${user_id}`
    );
    const result = await response.json();
    console.log("result", result);

    if (
      result.success &&
      (Array.isArray(result.data) || Array.isArray(result.user_answers))
    ) {
      container.innerHTML = null;

      const hasAnswered = result.already_answered === true;
      const quizData = hasAnswered ? result.user_answers : result.data;

      if (quizData.length === 0) {
        container.innerHTML = `<p>This quiz doesn't have any questions yet.</p>`;
        return;
      }

      const form = document.createElement("form");
      form.className = "quiz-form";

      const sectionRefs = [];

      quizData.forEach((question, index) => {
        const section = document.createElement("div");
        section.className = "quiz-section";
        section.dataset.index = index;
        section.dataset.questionId = question.question_id;

        const title = document.createElement("h3");
        title.textContent = question.content || question.question_content;
        section.appendChild(title);

        const answers = hasAnswered
          ? question.question_answers
          : question.answers;

        answers.forEach((answer) => {
          const label = document.createElement("label");
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = `question-${question.question_id}`;
          radio.value = answer.answer_id;

          if (hasAnswered) {
            if (answer.chosen) radio.checked = true;
            radio.disabled = true;
          }

          label.appendChild(radio);
          label.append(` ${answer.answer}`);
          section.appendChild(label);
          section.appendChild(document.createElement("br"));
        });

        form.appendChild(section);
        sectionRefs.push(section);
      });

      const submitButton = document.createElement("button");
      submitButton.type = "submit";
      submitButton.innerText = hasAnswered ? "Already Submitted" : "Submit";

      if (hasAnswered) {
        submitButton.disabled = true;
        submitButton.style.backgroundColor = "grey";
        submitButton.style.cursor = "not-allowed";

        const scoreDisplay = document.createElement("p");
        scoreDisplay.textContent = `✅ You already completed this quiz. Your score: ${result.score}/100`;
        scoreDisplay.style.fontWeight = "bold";
        scoreDisplay.style.color = "green";
        scoreDisplay.style.marginTop = "1rem";
        form.prepend(scoreDisplay);
      }

      form.appendChild(submitButton);

      if (!hasAnswered) {
        form.addEventListener("submit", async function (e) {
          e.preventDefault();

          let allAnswered = true;
          let firstUnanswered = null;
          const answers = [];
          const quizResponse = {
            user_id: user_id,
            quiz_id: quiz_id,
            answers: [],
          };

          sectionRefs.forEach((section) => {
            const questionId = section.dataset.questionId;
            const radios = section.querySelectorAll(
              `input[name="question-${questionId}"]`
            );
            const selected = [...radios].find((r) => r.checked);

            if (!selected) {
              allAnswered = false;
              section.style.border = "2px solid red";
              if (!firstUnanswered) firstUnanswered = section;
            } else {
              section.style.border = "none";
              quizResponse.answers.push({
                question_id: questionId,
                answer_id: selected.value,
              });
            }
          });

          if (!allAnswered) {
            alert("Please answer all questions before submitting.");
            firstUnanswered?.scrollIntoView({ behavior: "smooth" });
            return;
          }

          const confirmation = document.getElementById("confirmation");
          if (confirmation) confirmation.remove();

          const msg = document.createElement("div");
          msg.id = "confirmation";
          msg.textContent = "Answers submitted successfully!";
          msg.style.color = "green";
          msg.style.marginTop = "1rem";
          form.appendChild(msg);

          await fetch("./backend/interactions/submitAnswers.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(quizResponse),
          });
          window.renderQuiz();
        });
      }

      container.appendChild(form);
    } else {
      container.innerHTML = "<p>Failed to load quiz questions.</p>";
    }
  } catch (error) {
    console.error("Error loading quiz:", JSON.stringify(error));
    // container.innerHTML =
    //   "<p>Something went wrong while fetching the quiz.</p>";
  }
}

// Load correct function based on URL
window.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name");

  // Redirect to login.html if user is not logged in
  if (!userId || !userName) {
    window.location.href = "login.html";
    return;
  }

  // Show user info and logout button
  const userInfo = document.getElementById("user-info");

  if (userInfo) {
    const nameDisplay = document.createElement("p");
    nameDisplay.innerHTML = `
        User: ${userName}
    `;
    nameDisplay.style.margin = "0px";
    nameDisplay.style.cursor = "default";

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Logout";
    logoutBtn.style.fontSize = "18px";
    logoutBtn.style.padding = "4px 10px";
    logoutBtn.style.margin = "0px";
    logoutBtn.style.cursor = "pointer";
    logoutBtn.style.backgroundColor = "red";

    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });

    userInfo.appendChild(nameDisplay);
    userInfo.appendChild(logoutBtn);
  }

  const path = window.location.pathname;

  console.log("path", path);
  if (path == "/quizzy-app/" || path == "/quizzy-app/home.html") {
    renderQuizNames();
  } else if (path == "/quizzy-app/quiz.html") {
    renderQuiz();
  }
});
