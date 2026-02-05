function copyEmail() {
  const email = "weservices2022@gmail.com";
  navigator.clipboard.writeText(email).then(() => {
    alert("Email copied: " + email);
  });
}

/**
 * Builds time options between startHour and endHour (inclusive) in stepMinutes increments.
 * Example: 10 AM to 8 PM (20:00).
 */
function buildTimeOptions(selectEl, startHour, endHour, stepMinutes) {
  if (!selectEl) return;

  selectEl.innerHTML = "";

  const pad = (n) => String(n).padStart(2, "0");

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += stepMinutes) {
      // Stop exactly at the final hour (e.g., 20:00) and do not go past it
      if (hour === endHour && min > 0) break;

      const isPM = hour >= 12;
      const displayHour = ((hour + 11) % 12) + 1;
      const displayMin = pad(min);

      const label = `${displayHour}:${displayMin} ${isPM ? "PM" : "AM"}`;
      const value = `${pad(hour)}:${pad(min)}`;

      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      selectEl.appendChild(opt);
    }
  }
}

/**
 * Reads ?service= from URL and sets the service dropdown.
 */
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

  // If the service isn't found, drop it into Details box
  const detailsField = document.getElementById("details");
  if (!found && detailsField) detailsField.value = `Requested service: ${service}\n`;
}

/**
 * Initializes the booking form page.
 */
function initBookingForm() {
  const timeSelect = document.getElementById("time");
  const serviceSelect = document.getElementById("service");

  // UPDATED: 10 AM (10) to 8 PM (20)
  buildTimeOptions(timeSelect, 10, 20, 15);
  applyServiceFromQuery(serviceSelect);

  // Set min date to today
  const dateEl = document.getElementById("date");
  if (dateEl) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateEl.min = `${yyyy}-${mm}-${dd}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("bookingForm")) {
    initBookingForm();
  }
});
