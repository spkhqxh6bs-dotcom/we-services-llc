function copyEmail() {
  const emails = "wevans@weservicesllc.biz, jevans@weservicesllc.biz";
  navigator.clipboard.writeText(emails).then(() => {
    alert("Copied: " + emails);
  });
}

function buildTimeOptions(selectEl, startHour, endHour, stepMinutes) {
  if (!selectEl) return;

  selectEl.innerHTML = "";
  const pad = (n) => String(n).padStart(2, "0");

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += stepMinutes) {
      if (hour === endHour && min > 0) break;

      const isPM = hour >= 12;
      const displayHour = ((hour + 11) % 12) + 1;
      const label = `${displayHour}:${pad(min)} ${isPM ? "PM" : "AM"}`;
      const value = `${pad(hour)}:${pad(min)}`;

      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      selectEl.appendChild(opt);
    }
  }
}

function applyServiceFromQuery(selectEl) {
  if (!selectEl) return;
  const params = new URLSearchParams(window.location.search);
  const service = params.get("service");
  if (!service) return;

  const found = [...selectEl.options].some(opt => {
    if (opt.value === service) {
      selectEl.value = service;
      return true;
    }
    return false;
  });

  const detailsField = document.getElementById("details");
  if (!found && detailsField) detailsField.value = `Requested service: ${service}\n`;
}

function setMinDate() {
  const dateEl = document.getElementById("date");
  if (!dateEl) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateEl.min = `${yyyy}-${mm}-${dd}`;
}

function wireBookingFormSubmit() {
  const form = document.getElementById("bookingForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const action = form.getAttribute("action") || "";
    if (action.includes("YOUR_FORM_ID")) {
      status.style.display = "block";
      status.textContent = "Form is not connected yet. Replace YOUR_FORM_ID in book.html with your Formspree form ID.";
      return;
    }

    status.style.display = "block";
    status.textContent = "Submitting your request…";

    try {
      const formData = new FormData(form);
      const res = await fetch(action, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      if (res.ok) {
        form.reset();
        buildTimeOptions(document.getElementById("time"), 10, 20, 15);
        status.textContent = "Request submitted successfully. You’ll receive a confirmation by email.";
      } else {
        status.textContent = "Submission failed. Please try again.";
      }
    } catch (err) {
      status.textContent = "Submission failed (network error). Please try again.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("bookingForm")) {
    buildTimeOptions(document.getElementById("time"), 10, 20, 15);
    applyServiceFromQuery(document.getElementById("service"));
    setMinDate();
    wireBookingFormSubmit();
  }
});
