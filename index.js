class App {
  constructor() {
    // State variables
    this.currentIndex = 0;
    this.isSubmitted = false;
    this.questions = [];
    this.selectedOption = null;
    this.userScore = 0;

    // Dropdown state
    this.currentDropdown = null;

    // HTML elements
    this.$container = document.querySelector("[data='quiz-container']");
    this.$currentQuestion = document.querySelector("[data='current-question']");
    this.$submitButton = document.querySelector("[data='submit-button']");
    this.$nextButton = document.querySelector("[data='next-button']");
    this.$finalText = document.querySelector("[data='final-text']");
    this.$progressBar = document.querySelector("[data='progress-bar']");
  }

  async init() {
    try {
      // Fetch questions from the JSON file
      await fetch("questions.json")
        .then((res) => res.json())
        .then((data) => {
          // Shuffle questions and select the first 20
          this.shuffleArray(data);
          this.questions = data.slice(0, 20);
        });

      // Start with the first question
      this.newQuestion();

      // Set up event listeners
      this.setUpEventListeners();

      // Set progress bar max value
      this.$progressBar.setAttribute("max", this.questions.length * 10);
    } catch (err) {
      console.log("Error fetching questions:", err);
    }
  }

  shuffleArray(arr) {
    // Fisher-Yates shuffle algorithm
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  newQuestion() {
    // Disable buttons
    this.$submitButton.disabled = true;
    this.$submitButton.classList.add("disabled");
    this.$nextButton.disabled = true;
    this.$nextButton.classList.add("disabled");

    // Reset state
    this.isSubmitted = false;
    this.selectedOption = null;
    this.$container.classList.remove("submitted");

    // Render new question
    this.renderQuestion();

    // Update progress bar
    this.updateProgressBar();
  }

  renderQuestion() {
    // Render question based on its type
    switch (this.questions[this.currentIndex].type) {
      case "multipleChoice":
        this.renderMultipleChoiceQuestion();
        break;
      case "trueFalse":
        this.renderTrueFalseQuestion();
        break;
      case "matching":
        this.renderMatchingQuestion();
        break;
      case "fillInTheBlank":
        this.renderFillInTheBlankQuestion();
        break;
      default:
        console.error("Invalid question type");
    }
  }

  renderMultipleChoiceQuestion() {
    const question = this.questions[this.currentIndex];
    const shuffledOptions = this.shuffleArray(question.options);

    const optionsList = shuffledOptions
      .map((option) => {
        const escaped = this.escapeHTML(option);

        return `<li class="question-option">${escaped}</li>`;
      })
      .join("");

    // Render question
    this.$currentQuestion.innerHTML = `
      <h2 class="question-text">${this.escapeHTML(question.question)}</h2>
      <ul class="question-list">${optionsList}</ul>
    `;

    // Add event listeners to options
    const options = this.$currentQuestion.querySelectorAll("li");
    options.forEach((option) => {
      option.addEventListener("click", () => {
        this.handleOptionClick(option);
      });
    });
  }

  renderTrueFalseQuestion() {
    const question = this.questions[this.currentIndex];
    const optionsList = question.options
      .map((option) => {
        const escaped = this.escapeHTML(option);

        return `<li class="question-option">${escaped}</li>`;
      })
      .join("");

    // Render question
    this.$currentQuestion.innerHTML = `
      <h2 class="question-text">${this.escapeHTML(question.question)}</h2>
      <ul class="question-list">${optionsList}</ul>
    `;

    // Add event listeners to options
    const options = this.$currentQuestion.querySelectorAll("li");
    options.forEach((option) => {
      option.addEventListener("click", () => {
        this.handleOptionClick(option);
      });
    });
  }

  renderMatchingQuestion() {
    const question = this.questions[this.currentIndex];
    const shuffledItems = this.shuffleArray(question.options.items);
    const shuffledMatches = this.shuffleArray(question.options.matches);

    const matchesList = shuffledMatches
      .map((item) => {
        const escaped = this.escapeHTML(item);

        return `<li class="dropdown-item">${escaped}</li>`;
      })
      .join("");

    const dropdown = `
      <button class="dropdown-btn">Select<i class="fa-solid fa-chevron-up arrow" id="arrow"></i>
      </button>
      <ul class="dropdown" id="dropdown">${matchesList}</ul>
    `;

    const itemsList = shuffledItems
      .map((item) => {
        const escaped = item.includes("<") ? item : this.escapeHTML(item);

        return `<li class="question-option">${escaped}${dropdown}</li>`;
      })
      .join("");

    // Render question
    this.$currentQuestion.innerHTML = `
      <h2 class="question-text">${this.escapeHTML(question.question)}</h2>
      <ul class="question-list matching-question">${itemsList}</ul>
    `;

    const options = this.$currentQuestion.querySelectorAll(".question-option");
    options.forEach((option) => {
      const dropdownBtn = option.querySelector(".dropdown-btn");
      const dropdownMenu = option.querySelector(".dropdown");

      // Add event listeners to dropdowns
      dropdownBtn.addEventListener("click", () => {
        // Check if there is currently a dropdown open
        if (!this.currentDropdown) {
          this.currentDropdown = dropdownMenu;
          dropdownMenu.classList.add("show");
        } else {
          this.currentDropdown.classList.remove("show");
          this.currentDropdown = dropdownMenu;
          dropdownMenu.classList.add("show");
        }
      });

      // Add event listeners to dropdown items
      const dropdownItems = dropdownMenu.querySelectorAll(".dropdown-item");
      dropdownItems.forEach((item) => {
        item.addEventListener("click", () => {
          dropdownBtn.innerHTML = `
            ${item.textContent}
            <i class="fa-solid fa-chevron-up arrow" id="arrow"></i>
          `;
          dropdownMenu.classList.remove("show");

          this.handleMatchingClick();
        });
      });
    });
  }

  renderFillInTheBlankQuestion() {
    const question = this.questions[this.currentIndex];

    // Render question
    this.$currentQuestion.innerHTML = `
      <h2 class="question-text">${this.escapeHTML(question.question)}</h2>
      <ul class="question-list"><input class="question-option" type="text" name="question-input" maxlength="25" required/></ul>
    `;

    const input = this.$currentQuestion.querySelector("input");
    input.addEventListener("input", () => {
      if (input.value) {
        this.handleTextInput();
      }
    });
  }

  updateProgressBar() {
    const step = 1;
    const target = (this.currentIndex + 1) * 10;
    let current = +this.$progressBar.getAttribute("value");

    const update = () => {
      if (current < target) {
        current += step;
        this.$progressBar.setAttribute("value", current);
        requestAnimationFrame(update);
      }
    };

    update();
  }

  handleOptionClick(clickedOption) {
    if (this.isSubmitted) return;

    if (this.selectedOption !== null) {
      this.selectedOption.classList.remove("selected");
    }

    this.selectedOption = clickedOption;
    this.selectedOption.classList.add("selected");

    // Enable submit button
    this.$submitButton.disabled = false;
    this.$submitButton.classList.remove("disabled");
  }

  handleMatchingClick() {
    if (this.isSubmitted) return;

    const dropdownBtnTexts = Array.from(
      this.$currentQuestion.querySelectorAll(".dropdown-btn")
    ).map((btn) => btn.innerText);

    if (!dropdownBtnTexts.includes("Select")) {
      // Enable submit button
      this.$submitButton.disabled = false;
      this.$submitButton.classList.remove("disabled");
    }
  }

  handleTextInput() {
    if (this.isSubmitted) return;

    // Enable submit button
    this.$submitButton.disabled = false;
    this.$submitButton.classList.remove("disabled");
  }

  setUpEventListeners() {
    this.$submitButton.addEventListener("click", () => {
      const question = this.questions[this.currentIndex];

      if (question.type === "trueFalse" || question.type === "multipleChoice") {
        this.showCorrectAnswer(question);
      } else if (question.type === "matching") {
        this.showCorrectMatches(question);
      } else if (question.type === "fillInTheBlank") {
        this.showCorrectFillInTheBlank(question);
      }

      // Enable next button
      this.$nextButton.disabled = false;
      this.$nextButton.classList.remove("disabled");
    });

    this.$nextButton.addEventListener("click", () => {
      this.currentIndex++;

      if (this.currentIndex === this.questions.length) {
        this.handleEndOfQuiz();
      } else {
        this.newQuestion();
      }
    });

    document.addEventListener("click", (e) => {
      if (this.currentDropdown && !e.target.closest(".question-option")) {
        this.currentDropdown.classList.remove("show");
        this.currentDropdown = null;
      }
    });
  }

  showCorrectAnswer(question) {
    const selected = this.selectedOption.textContent;
    const correct = question.correctOption;

    if (selected === correct) {
      this.selectedOption.classList.add("correct");
      this.userScore++;
    } else {
      this.selectedOption.classList.add("incorrect");
    }

    // Disable options
    this.isSubmitted = true;
    this.$container.classList.add("submitted");

    // Disable submit button
    this.$submitButton.disabled = true;
    this.$submitButton.classList.add("disabled");
  }

  showCorrectMatches(question) {
    const correct = question.correctMatches;

    let rawAnswers;
    let answers = {};

    if (this.$currentQuestion.querySelector(".fa-brands")) {
      rawAnswers = Array.from(
        this.$currentQuestion.querySelectorAll(".fa-brands")
      ).map((el) => el.outerHTML);

      const selectedAnswers = Array.from(
        this.$currentQuestion.querySelectorAll(".question-option")
      ).map((el) => el.innerText);

      for (let i = 0; i < rawAnswers.length; i++) {
        answers[rawAnswers[i]] = selectedAnswers[i];
      }
    } else {
      rawAnswers = Array.from(
        this.$currentQuestion.querySelectorAll(".question-option")
      ).map((el) => [...el.innerText.split("\n")]);

      for (let i = 0; i < rawAnswers.length; i++) {
        answers[rawAnswers[i][0]] = rawAnswers[i][1];
      }
    }

    for (const selectedItem in answers) {
      const correctAnswer = correct[
        selectedItem.replaceAll('"', "'")
      ].replaceAll("'", '"');

      let currentOption;

      if (this.$currentQuestion.querySelector(".fa-brands")) {
        [currentOption] = Array.from(
          this.$currentQuestion.querySelectorAll(".fa-brands")
        ).filter((i) => i.outerHTML === selectedItem);
        currentOption = currentOption.parentElement;
      } else {
        [currentOption] = Array.from(
          this.$currentQuestion.querySelectorAll(".question-option")
        ).filter((el) => el.innerText.includes(selectedItem));
      }

      if (answers[selectedItem] === correctAnswer) {
        currentOption.classList.add("correct");
        this.userScore++;
      } else {
        currentOption.classList.add("incorrect");
      }
    }

    // Disable options
    this.isSubmitted = true;
    this.$container.classList.add("submitted");

    // Disable submit button
    this.$submitButton.disabled = true;
    this.$submitButton.classList.add("disabled");
  }

  showCorrectFillInTheBlank(question) {
    const input = this.$currentQuestion.querySelector("input");
    const correctOptions = question.correctOptions;

    // Go through all correct options and check if the input matches any of them
    let isCorrect = false;
    for (const option of correctOptions) {
      if (input.value.toLowerCase() === option.toLowerCase()) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      input.classList.add("correct");
      this.userScore++;
    } else {
      input.classList.add("incorrect");
    }

    // Disable options
    this.isSubmitted = true;
    this.$container.classList.add("submitted");

    // Disable submit button
    this.$submitButton.disabled = true;
    this.$submitButton.classList.add("disabled");
  }

  escapeHTML(html) {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
  }

  handleEndOfQuiz() {
    const totalPossibleScore = this.questions.reduce((total, question) => {
      return question.type !== "matching" ? total + 1 : total + 4;
    }, 0);

    this.$container.classList.add("final");
    this.$finalText.innerHTML = `
    You scored <span class="bold">${this.userScore}</span> out of <span class="bold">${totalPossibleScore}</span> possible points!`;

    this.reset();
  }

  reset() {
    const $restartButton = document.querySelector("[data='restart-button']");
    $restartButton.addEventListener("click", async () => {
      // Reset state
      this.currentIndex = 0;
      this.userScore = 0;

      // Shuffle questions and render the first one
      await fetch("questions.json")
        .then((res) => res.json())
        .then((data) => {
          // Shuffle questions and select the first 20
          this.shuffleArray(data);
          this.questions = data.slice(0, 20);
        });

      // Start with the first question
      this.newQuestion();

      // Reset container class
      this.$container.classList.remove("final");

      // Reset progress bar
      this.$progressBar.setAttribute("value", 0);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
