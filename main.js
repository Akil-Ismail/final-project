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
          </a>
          `;
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
window.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;
  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name");

  // Redirect to login.html if user is not logged in
  if (!userId || !userName) {
    window.location.href = "login.html";
    return;
  }

  if (path == "/quizzy-app/dashboard.html") {
    document
      .getElementById("searchInput")
      .addEventListener("input", handleSearch);
    if (localStorage.getItem("user_name").toLowerCase() != "admin") {
      window.history.back();
      return;
    }
    fetch("./backend/interactions/adminListDisplay.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.results)) {
          allResults = data.results;
          renderTable(allResults);
        } else {
          document.getElementById(
            "table-container"
          ).innerHTML = `<p class="no-results">Failed to load results.</p>`;
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        document.getElementById(
          "table-container"
        ).innerHTML = `<p class="no-results">An error occurred while fetching data.</p>`;
      });

    const container = document.getElementById("quizes");
    const loader = document.createElement("div");
    loader.innerHTML = `<div class="loader"></div>`;
    container.appendChild(loader);

    const quizes = await getQuizNames();

    if (Array.isArray(quizes)) {
      container.innerHTML = null;
      quizes.forEach((item) => {
        const itemDiv = document.createElement("div");
        itemDiv.id = `quiz-${item.id}`;
        itemDiv.innerHTML = `
                <button onclick="showQuizContent(${item.id})" class="choose-quiz">${item.name}</button>
                <button onclick="deleteQuiz(${item.id})">&times;</button>
              `;
        container.appendChild(itemDiv);
      });
    } else {
      alert("Error fetching quizzes");
      console.error("Error fetching quizzes:", quizes);
    }
  } else if (path == "/quizzy-app/home.html") {
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
      renderQuizNames();
    }
  } else if (path == "/quizzy-app/quiz.html") {
    renderQuiz();
  }
});

function logout() {
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  window.location.href = "login.html";
}

let allResults = [];

function renderTable(filteredData) {
  const container = document.getElementById("table-container");

  if (!filteredData.length) {
    container.innerHTML = `<p class="no-results">No matching results found.</p>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "results-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>User</th>
        <th>Quiz</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
      ${filteredData
        .map(
          (item) => `
        <tr>
          <td>${item.username}</td>
          <td>${item.quiz_name}</td>
          <td>${item.score}%</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

  container.innerHTML = "";
  container.appendChild(table);
}

function handleSearch() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allResults.filter(
    (item) =>
      item.username.toLowerCase().includes(searchTerm) ||
      item.quiz_name.toLowerCase().includes(searchTerm)
  );
  renderTable(filtered);
}

function openQuizes() {
  document.getElementById("add").style.display = "block";
}

function closeQuizes() {
  document.getElementById("add").style.display = "none";
}

function openAddNewQuestion(e) {
  e.preventDefault();
  if (document.getElementById("new-question"))
    document.getElementById("new-question").hidden = false;
  if (document.getElementById("new-question-new"))
    document.getElementById("new-question-new").hidden = false;
  if (document.getElementById("open-add-new-question"))
    document.getElementById("open-add-new-question").hidden = true;
  if (document.getElementById("open-add-new-question-new"))
    document.getElementById("open-add-new-question-new").hidden = true;
}

function closeAddNewQuestion() {
  if (document.getElementById("new-question"))
    document.getElementById("new-question").hidden = true;
  if (document.getElementById("new-question-new"))
    document.getElementById("new-question-new").hidden = true;
}

async function showQuizContent(id) {
  var quiz = document.getElementById("dash-quiz");
  quiz.hidden = false;
  document.getElementById("add-content").style.display = "none";

  try {
    const response = await fetch(
      `./backend/interactions/getQuizContent.php?quiz_id=${id}`
    );
    const result = await response.json();
    console.log("result", result);

    if (result.success && Array.isArray(result.data)) {
      const quizData = result.data;

      quiz.innerHTML = `
      <span class="close" onclick="closeQuiz()">&times;</span>
      <h3>${result.quiz_name}</h3>
      <div class="separator"></div>
      <div id="questions" class="questions">
        <form id="new-question" hidden class="question">
            <h3>New Question</h3>
            <div class="separator"></div>
            <label class="question-input"
              >Question:
              <input
                id="new-question-input"
                placeholder="Don't forget the '?'"
              />
            </label>
            <div id="new-answers" class="answers">
              <div class="answer-option">
                <input class="answer-input" placeholder="Answer text" />
                <input
                  type="radio"
                  name="correct-answer"
                  class="correct-radio"
                />
                Correct
              </div>
              <button onclick="addAnswerInput(event)">+</button>
            </div>
            <button onclick="addNewQuestionToQuiz(event, ${id})">
              Submit New Question
            </button>
          </form>
      </div>
        <button id="open-add-new-question-new" onclick="openAddNewQuestion(event)">Add New Question</button>
      `;

      var questions = document.getElementById("questions");

      const children = questions.children;
      const firstChild = children[0];

      quizData.forEach((question) => {
        console.log(question);
        var questionEl = document.createElement("div");
        questionEl.innerHTML = `
        <div id="question-${question.question_id}" class="question">
          <button onclick="deleteQuestion(${question.question_id})">&times;</button>
          <div class="content">${question.content}</div>
          <div id="answers-${question.question_id}" class="answers">

          </div>
        </div>
      `;
        questions.insertBefore(questionEl, firstChild);
        var answers = document.getElementById(
          `answers-${question.question_id}`
        );
        question.answers.forEach((answer) => {
          var answerEl = document.createElement("label");
          answerEl.innerHTML = `
              ${answer.answer}. (${
            JSON.parse(answer.correct_answer) ? "True" : "False"
          }) <br />
    `;
          answers.appendChild(answerEl);
        });
      });
    } else {
      container.innerHTML = "<p>Failed to load quiz questions.</p>";
    }
  } catch (error) {
    console.error("Error loading quiz:", JSON.stringify(error));
  }
}

function closeQuiz() {
  var quiz = document.getElementById("dash-quiz");
  quiz.hidden = true;
  document.getElementById("add-content").style.display = "block";
  if (document.getElementById("new-question"))
    document.getElementById("new-question").hidden = true;
  if (document.getElementById("new-question-new"))
    document.getElementById("new-question-new").hidden = true;
  if (document.getElementById("open-add-new-question"))
    document.getElementById("open-add-new-question").hidden = false;
  if (document.getElementById("open-add-new-question-new"))
    document.getElementById("open-add-new-question-new").hidden = false;
}

function openAddNewQuiz() {
  if (document.getElementById("open-add-new-question"))
    document.getElementById("open-add-new-question").hidden = false;
  if (document.getElementById("open-add-new-question-new"))
    document.getElementById("open-add-new-question-new").hidden = false;
  document.getElementById("add-content").style.display = "none";
  document.getElementById("new-quiz").hidden = false;
  if (document.getElementById("new-question"))
    document.getElementById("new-question").hidden = true;
  if (document.getElementById("new-question-new"))
    document.getElementById("new-question-new").hidden = true;
}

function closeAddNewQuiz() {
  if (document.getElementById("open-add-new-question"))
    document.getElementById("open-add-new-question").hidden = false;
  if (document.getElementById("open-add-new-question-new"))
    document.getElementById("open-add-new-question-new").hidden = false;
  document.getElementById("new-quiz").hidden = true;
  document.getElementById("add-content").style.display = "block";
  if (document.getElementById("new-question"))
    document.getElementById("new-question").hidden = true;
  if (document.getElementById("new-question-new"))
    document.getElementById("new-question-new").hidden = true;
}

let quizQuestions = []; // To store the questions and answers before submission

function addAnswerInput(event) {
  event.preventDefault();
  const container = document.getElementById("new-answers");

  const answerDiv = document.createElement("div");
  answerDiv.classList.add("answer-option");

  answerDiv.innerHTML = `
    <input class="answer-input" placeholder="Answer text" />
    <input type="radio" name="correct-answer" class="correct-radio" />
    Correct
  `;

  const children = container.children;
  const lastChild = children[children.length - 1];
  container.insertBefore(answerDiv, lastChild);
}

// Function to handle the submission of a new question
async function submitNewQuestion(event) {
  event.preventDefault();

  // Get question content
  const questionContent = document
    .getElementById("new-question-input")
    .value.trim();

  if (!questionContent) {
    alert("Please enter the question text!");
    return;
  }

  // Get answers and check the correct answer
  const answerInputs = document.querySelectorAll("#new-answers .answer-option");
  const answers = [];
  let correctAnswerFound = false;

  answerInputs.forEach((answerDiv) => {
    const answerText = answerDiv.querySelector(".answer-input").value.trim();
    const isCorrect = answerDiv.querySelector(".correct-radio").checked;

    if (answerText) {
      answers.push({ answer: answerText, correct_answer: isCorrect ? 1 : 0 });
      if (isCorrect) correctAnswerFound = true;
    }
  });

  if (answers.length < 2) {
    alert("Please add at least two answers.");
    return;
  }

  if (!correctAnswerFound) {
    alert("Please mark one correct answer!");
    return;
  }

  // Store the question and its answers
  quizQuestions.push({
    content: questionContent,
    answers: answers,
  });

  // Clear the form for the next question
  document.getElementById("new-question-input").value = "";
  document.getElementById("new-answers").innerHTML = `
    <div class="answer-option">
      <input class="answer-input" placeholder="Answer text" />
      <input type="radio" name="correct-answer" class="correct-radio" />
      Correct
    </div>
    <button onclick="addAnswerInput(event)">+</button>
  `;

  console.log("Question added:", quizQuestions);

  // Send the data to the backend to create the quiz
  await submitQuizToBackend();
}

async function submitQuizToBackend() {
  const quizName = document.getElementById("quiz-name").value.trim();

  if (!quizName) {
    alert("Quiz name is required!");
    return;
  }

  if (quizQuestions.length === 0) {
    alert("Please add at least one question to the quiz.");
    return;
  }

  const quizData = {
    name: quizName,
    questions: quizQuestions,
  };

  console.log("Submitting Quiz:", quizData);

  try {
    const response = await fetch("./backend/interactions/createQuiz.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quizData),
    });

    const result = await response.json();
    console.log("Server response:", result);

    if (result.success) {
      alert("Quiz created successfully!");
      location.reload(); // Reload or redirect to quiz list page
    } else {
      alert("Failed to create quiz.");
    }
  } catch (error) {
    console.error("Error submitting quiz:", error);
    alert("An error occurred while submitting the quiz.");
  }
}

async function addNewQuestionToQuiz(event, quizId) {
  event.preventDefault();

  const questionInput = document.getElementById("new-question-input");
  const questionContent = questionInput.value.trim();

  if (!questionContent) {
    alert("Please enter the question content.");
    return;
  }

  const answersDiv = document.getElementById("new-answers");
  const answerOptions = answersDiv.querySelectorAll(".answer-option");

  const answers = [];
  let correctAnswerIndex = -1;

  answerOptions.forEach((option, index) => {
    const textInput = option.querySelector(".answer-input");
    const radioInput = option.querySelector(".correct-radio");

    if (textInput && textInput.value.trim() !== "") {
      answers.push(textInput.value.trim());
      if (radioInput && radioInput.checked) {
        correctAnswerIndex = index;
      }
    }
  });

  if (answers.length < 2) {
    alert("Please add at least two answers.");
    return;
  }

  if (correctAnswerIndex === -1) {
    alert("Please select the correct answer.");
    return;
  }

  const formData = new FormData();
  formData.append("quiz_id", quizId);
  formData.append("question_content", questionContent);
  answers.forEach((answer, index) => {
    formData.append(`answers[${index}][content]`, answer);
    formData.append(
      `answers[${index}][is_correct]`,
      index === correctAnswerIndex ? 1 : 0
    );
  });

  try {
    const response = await fetch("./backend/interactions/createQuestion.php", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log("Server response:", result);

    if (result.success) {
      alert("Question added successfully!");
      closeAddNewQuiz();
      showQuizContent(result.quiz_id);
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    console.error("Error submitting question:", error);
  }
}

// --- ADMIN: Open Manage Quizzes Modal ---
function openQuizes() {
  document.getElementById("add").style.display = "block";
}

function closeQuizes() {
  document.getElementById("add").style.display = "none";
}

// --- ADMIN: Open/Close "Add New Quiz" Modal ---
function openAddNewQuiz() {
  document.getElementById("add-content").style.display = "none";
  document.getElementById("new-quiz").hidden = false;
}

function closeAddNewQuiz() {
  document.getElementById("new-quiz").hidden = true;
  document.getElementById("add-content").style.display = "block";
}

// --- ADMIN: Open/Close Add New Question (inside Quiz Modal) ---
function adminOpenAddNewQuestion(e) {
  e.preventDefault();
  if (document.getElementById("admin-new-question"))
    document.getElementById("admin-new-question").hidden = false;
  if (document.getElementById("admin-new-question-new"))
    document.getElementById("admin-new-question-new").hidden = false;
  if (document.getElementById("admin-open-add-new-question"))
    document.getElementById("admin-open-add-new-question").hidden = true;
}

function adminCloseAddNewQuestion() {
  if (document.getElementById("admin-new-question"))
    document.getElementById("admin-new-question").hidden = true;
  if (document.getElementById("admin-new-question-new"))
    document.getElementById("admin-new-question-new").hidden = true;
  if (document.getElementById("admin-open-add-new-question"))
    document.getElementById("admin-open-add-new-question").hidden = false;
}

// --- ADMIN: Add Answer Input (Add New Question) ---
function adminAddAnswerInput(event) {
  event.preventDefault();

  const container = document.getElementById("admin-new-answers");

  const answerDiv = document.createElement("div");
  answerDiv.classList.add("answer-option");

  answerDiv.innerHTML = `
    <input class="answer-input" placeholder="Answer text" />
    <input type="radio" name="admin-correct-answer" class="correct-radio" /> Correct
  `;

  const children = container.children;
  const lastChild = children[children.length - 1];
  container.insertBefore(answerDiv, lastChild);
}

// --- ADMIN: Submit New Question Locally ---
async function adminSubmitNewQuestion(event) {
  event.preventDefault();

  const questionContent = document
    .getElementById("admin-new-question-input")
    .value.trim();

  if (!questionContent) {
    alert("Please enter the question text!");
    return;
  }

  const answerInputs = document.querySelectorAll(
    "#admin-new-answers .answer-option"
  );
  const answers = [];
  let correctAnswerFound = false;

  answerInputs.forEach((answerDiv) => {
    const answerText = answerDiv.querySelector(".answer-input").value.trim();
    const isCorrect = answerDiv.querySelector(".correct-radio").checked;

    if (answerText) {
      answers.push({ answer: answerText, correct_answer: isCorrect ? 1 : 0 });
      if (isCorrect) correctAnswerFound = true;
    }
  });

  if (answers.length < 2) {
    alert("Please add at least two answers.");
    return;
  }

  if (!correctAnswerFound) {
    alert("Please select one correct answer!");
    return;
  }

  let adminQuizQuestions = [];

  adminQuizQuestions.push({
    content: questionContent,
    answers: answers,
  });

  // Clear the form after adding question
  document.getElementById("admin-new-question-input").value = "";
  document.getElementById("admin-new-answers").innerHTML = `
    <div class="answer-option">
      <input class="answer-input" placeholder="Answer text" />
      <input type="radio" name="admin-correct-answer" class="correct-radio" /> Correct
    </div>
  `;

  adminSubmitQuizToBackend(adminQuizQuestions);
}

// --- ADMIN: Submit Full New Quiz to Backend ---
async function adminSubmitQuizToBackend(adminQuizQuestions) {
  const quizName = document.getElementById("quiz-name").value.trim();

  if (!quizName) {
    alert("Quiz name is required!");
    return;
  }

  if (adminQuizQuestions.length === 0) {
    alert("Add at least one question.");
    return;
  }

  const quizData = {
    name: quizName,
    questions: adminQuizQuestions,
  };

  console.log("Submitting Admin Quiz:", quizData);

  try {
    const response = await fetch("./backend/interactions/createQuiz.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quizData),
    });

    const result = await response.json();

    if (result.success) {
      alert("Quiz created successfully!");
      closeAddNewQuiz();
      showQuizContent(result.quiz_id);
    } else {
      alert("Failed to create quiz.");
    }
  } catch (error) {
    console.error("Error submitting quiz:", error);
    alert("An error occurred.");
  }
}

async function deleteQuestion(questionId) {
  console.log(questionId);
  try {
    const response = await fetch("./backend/interactions/deleteQuestion.php", {
      method: "POST", // Using POST as the method, but it could be DELETE if configured in PHP
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question_id: questionId }),
    });

    const result = await response.json();
    console.log("Server response:", result);

    if (result.success) {
      alert("Question deleted successfully.");
      document.getElementById(`question-${questionId}`).remove(); // Remove the question from UI
    } else {
      alert("Failed to delete question: " + result.error);
    }
  } catch (error) {
    console.error("Error deleting question:", error);
    alert("An error occurred while deleting the question.");
  }
}
async function deleteQuiz(quizId) {
  if (confirm("Are you sure you want to delete this quiz?")) {
    try {
      const response = await fetch("./backend/interactions/deleteQuiz.php", {
        method: "POST", // Using POST, you can use DELETE if configured
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quiz_id: quizId }),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (result.success) {
        alert("Quiz deleted successfully.");
        // Optionally, remove the quiz element from the DOM
        document.getElementById(`quiz-${quizId}`).remove();
      } else {
        alert("Failed to delete quiz: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("An error occurred while deleting the quiz.");
    }
  }
}
