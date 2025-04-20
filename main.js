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
      `./backend/interactions/getQuizContent.php?quiz_id=${quiz_id}`
    );
    const result = await response.json();
    console.log("result", result);

    if (result.success && Array.isArray(result.data)) {
      container.innerHTML = null;

      if (result.data.length === 0) {
        container.innerHTML = `<p>This quiz doesn't have any questions yet.</p>`;
        return;
      }

      const form = document.createElement("form");
      form.className = "quiz-form";

      const sectionRefs = [];

      result.data.forEach((question, index) => {
        const section = document.createElement("div");
        section.className = "quiz-section";
        section.dataset.index = index;
        section.dataset.questionId = question.question_id;

        const title = document.createElement("h3");
        title.textContent = question.content;
        section.appendChild(title);

        question.answers.forEach((answer) => {
          const label = document.createElement("label");
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = `question-${question.question_id}`;
          radio.value = answer.answer_id;
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
      submitButton.innerText = "Submit";
      form.appendChild(submitButton);

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        let allAnswered = true;
        let firstUnanswered = null;

        const answers = [];

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
            answers.push({
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

        console.log("User submitted answers:", answers);
        alert("Answers submitted!");
        // window.location.href = "/web%20practice/";
      });

      container.appendChild(form);
    } else {
      container.innerHTML = "<p>Failed to load quiz questions.</p>";
    }
  } catch (error) {
    console.error("Error loading quiz:", error);
    container.innerHTML =
      "<p>Something went wrong while fetching the quiz.</p>";
  }
}

// Load correct function based on URL
window.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  console.log("path", path);
  if (path == "/web%20practice/" || path == "/web%20practice/home.html") {
    renderQuizNames();
  } else if (path == "/web%20practice/quiz.html") {
    renderQuiz();
  }
});
