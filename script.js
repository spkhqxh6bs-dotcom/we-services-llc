document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("bookingForm");

  if (!bookingForm) {
    return;
  }

  const timeSelect = document.getElementById("time");
  const serviceSelect = document.getElementById("service");
  const submitBtn = document.getElementById("submitBtn");

  const intakeToggleBtn = document.getElementById("intakeToggleBtn");
  const intakePanel = document.getElementById("intakePanel");
  const intakeTitle = document.getElementById("intakeTitle");
  const intakeFields = document.getElementById("intakeFields");
  const saveIntakeBtn = document.getElementById("saveIntakeBtn");
  const intakeStatus = document.getElementById("intakeStatus");
  const intakeCompletedCheck = document.getElementById("intakeCompletedCheck");
  const intakeCompletedHidden = document.getElementById("intakeCompletedHidden");
  const intakeAnswersCompiled = document.getElementById("intakeAnswersCompiled");
  const formStatus = document.getElementById("formStatus");

  const intakeQuestions = {
    "Security Consulting": [
      "What security concern or situation do you need help with?",
      "Is this for personal, business, event, or property security?",
      "What outcome are you hoping to achieve from the consultation?"
    ],

    "Business Consulting": [
      "What type of business or idea do you need help with?",
      "What is the main problem you are trying to solve?",
      "What goal do you want to reach after the consultation?"
    ],

    "Couples Consulting": [
      "What topic or concern would you like support with?",
      "Are both parties aware of this consultation request?",
      "What would a successful consultation look like for you?"
    ],

    "Sports Consulting": [
      "What sport or athletic area do you need help with?",
      "Is this for training, performance, recruitment, mindset, or planning?",
      "What goal are you working toward?"
    ],

    "Educational Consulting": [
      "What education goal do you need help with?",
      "Is this for school planning, coursework, career direction, or skills development?",
      "What deadline or target date are you working with?"
    ],

    "Event Consulting": [
      "What type of event are you planning?",
      "What is the expected date and location of the event?",
      "What kind of support do you need most?"
    ],

    "AI Consulting": [
      "What are you trying to use AI for?",
      "Is this for personal use, business use, school, or automation?",
      "What task would you like AI to help improve?"
    ],

    "Real Estate Consulting": [
      "What real estate goal are you working toward?",
      "Are you buying, selling, renting, investing, or planning?",
      "What is your biggest question or concern right now?"
    ],

    "Art Consulting": [
      "What type of art or creative project do you need help with?",
      "Do you need help with branding, presentation, pricing, or promotion?",
      "What outcome are you hoping for?"
    ],

    "Web Design": [
      "What type of website do you need?",
      "How many pages or sections do you want?",
      "Do you already have a logo, pictures, domain, or written content?"
    ]
  };

  function populateTimes() {
    if (!timeSelect) {
      return;
    }

    timeSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a time";
    timeSelect.appendChild(defaultOption);

    for (let hour = 10; hour <= 20; hour++) {
      const option = document.createElement("option");

      const displayHour = hour > 12 ? hour - 12 : hour;
      const amPm = hour >= 12 ? "PM" : "AM";
      const timeLabel = `${displayHour}:00 ${amPm}`;

      option.value = timeLabel;
      option.textContent = timeLabel;

      timeSelect.appendChild(option);
    }
  }

  function applyServiceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const requestedService = params.get("service");

    if (!requestedService || !serviceSelect) {
      return;
    }

    const options = Array.from(serviceSelect.options);

    const match = options.find(option => option.value === requestedService);

    if (match) {
      serviceSelect.value = requestedService;
    }
  }

  function buildIntakeFields() {
    if (!serviceSelect || !intakeFields || !intakeTitle) {
      return;
    }

    const selectedService = serviceSelect.value;
    const questions = intakeQuestions[selectedService] || [];

    intakeTitle.textContent = `${selectedService} Intake Questions`;
    intakeFields.innerHTML = "";

    questions.forEach((question, index) => {
      const label = document.createElement("label");
      label.setAttribute("for", `intakeQuestion${index}`);
      label.textContent = question;

      const textarea = document.createElement("textarea");
      textarea.id = `intakeQuestion${index}`;
      textarea.name = `intake_question_${index + 1}`;
      textarea.rows = 3;
      textarea.placeholder = "Type your answer here...";
      textarea.required = true;

      intakeFields.appendChild(label);
      intakeFields.appendChild(textarea);
    });

    intakeCompletedCheck.checked = false;
    intakeCompletedHidden.value = "false";
    intakeAnswersCompiled.value = "";

    if (intakeStatus) {
      intakeStatus.style.display = "none";
      intakeStatus.textContent = "";
    }

    updateSubmitButton();
  }

  function saveIntakeAnswers() {
    const textareas = intakeFields.querySelectorAll("textarea");

    let allAnswered = true;
    const answers = [];

    textareas.forEach((textarea, index) => {
      const questionLabel = textarea.previousElementSibling
        ? textarea.previousElementSibling.textContent
        : `Question ${index + 1}`;

      const answer = textarea.value.trim();

      if (!answer) {
        allAnswered = false;
      }

      answers.push(`${questionLabel}\n${answer}`);
    });

    if (!allAnswered) {
      intakeStatus.textContent = "Please answer all intake questions before continuing.";
      intakeStatus.style.display = "block";

      intakeCompletedCheck.checked = false;
      intakeCompletedHidden.value = "false";
      intakeAnswersCompiled.value = "";

      updateSubmitButton();
      return;
    }

    intakeAnswersCompiled.value = answers.join("\n\n");
    intakeCompletedCheck.checked = true;
    intakeCompletedHidden.value = "true";

    intakeStatus.textContent = "Intake answers saved.";
    intakeStatus.style.display = "block";

    updateSubmitButton();
  }

  function requiredFieldsComplete() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value.trim();
    const time = document.getElementById("time").value.trim();
    const service = document.getElementById("service").value.trim();

    return Boolean(name && email && phone && date && time && service);
  }

  function updateSubmitButton() {
    const intakeComplete = intakeCompletedHidden.value === "true";

    if (requiredFieldsComplete() && intakeComplete) {
      submitBtn.disabled = false;
    } else {
      submitBtn.disabled = true;
    }
  }

  function saveBookingAndRedirect(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!requiredFieldsComplete()) {
      formStatus.textContent = "Please complete all required fields.";
      formStatus.style.display = "block";
      return;
    }

    if (intakeCompletedHidden.value !== "true") {
      formStatus.textContent = "Please complete and save the intake questions before continuing.";
      formStatus.style.display = "block";
      return;
    }

    const bookingData = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      preferred_date: document.getElementById("date").value,
      preferred_time: document.getElementById("time").value,
      service: document.getElementById("service").value,
      additional_details: document.getElementById("details").value.trim(),
      intake_completed: intakeCompletedHidden.value,
      intake_answers: intakeAnswersCompiled.value,
      created_at: new Date().toISOString()
    };

    localStorage.setItem("weservices_booking", JSON.stringify(bookingData));

    window.location.href = "pay.html";
  }

  populateTimes();
  applyServiceFromUrl();
  buildIntakeFields();
  updateSubmitButton();

  if (intakeToggleBtn && intakePanel) {
    intakeToggleBtn.addEventListener("click", () => {
      const isHidden = intakePanel.hidden;

      intakePanel.hidden = !isHidden;
      intakeToggleBtn.setAttribute("aria-expanded", String(isHidden));

      if (isHidden) {
        intakeToggleBtn.textContent = "Service Intake Questions (Click to Close)";
      } else {
        intakeToggleBtn.textContent = "Service Intake Questions (Click to Open)";
      }
    });
  }

  if (serviceSelect) {
    serviceSelect.addEventListener("change", buildIntakeFields);
  }

  if (saveIntakeBtn) {
    saveIntakeBtn.addEventListener("click", saveIntakeAnswers);
  }

  bookingForm.addEventListener("input", updateSubmitButton);
  bookingForm.addEventListener("change", updateSubmitButton);
  bookingForm.addEventListener("submit", saveBookingAndRedirect, true);
});
