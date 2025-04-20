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
  var loader = document.createElement("div");
  loader.innerHTML = `
        <div class="loader"></div>
     `;
  container.appendChild(loader);
  var quizes = await getQuizNames();
  if (Array.isArray(quizes)) {
    container.innerHTML = null;
    quizes.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.innerHTML = `
       <a href="quiz.html?id=${item.id}">
       <button class="choose-quiz" >${item.name}</button>
       </a>
        `;
      container.appendChild(itemDiv);
    });
  } else {
    alert("Error fetching quizzes:", quizes);
    console.error("Error fetching quizzes:", quizes);
  }
}

async function renderQuiz() {
  const params = new URLSearchParams(window.location.search);
  var quiz_id = params.get("id");
}

window.onload = function () {
  var path = window.location.pathname;
  if (path === "/web%20practice/home.html") {
    renderQuizNames();
  } else if (path === "/web%20practice/quiz.html") {
    renderQuiz();
  }
};
