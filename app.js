const form = document.querySelector("#verification-form");
const continueButton = document.querySelector("#continue-button");
const backButton = document.querySelector("#back-button");
const submitButton = document.querySelector("#submit-button");
const resetButton = document.querySelector("#reset-button");
const formMessage = document.querySelector("#form-message");
const successPanel = document.querySelector("#success-panel");
const progress = document.querySelector(".progress");

const fields = {
  email: document.querySelector("#email"),
  minecraftUsername: document.querySelector("#minecraftUsername"),
  discordUsername: document.querySelector("#discordUsername"),
  confirmEmail: document.querySelector("#confirmEmail"),
  confirmMinecraftUsername: document.querySelector("#confirmMinecraftUsername"),
  confirmDiscordUsername: document.querySelector("#confirmDiscordUsername"),
  consent: document.querySelector("#consent"),
};

document.querySelector("#startedAt").value = String(Date.now());

const rules = {
  email: {
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Enter a valid email address.",
  },
  minecraftUsername: {
    test: (value) => /^[A-Za-z0-9_]{3,16}$/.test(value),
    message: "Use 3–16 letters, numbers, or underscores.",
  },
  discordUsername: {
    test: (value) => /^[A-Za-z0-9._#-]{2,32}$/.test(value),
    message: "Use 2–32 letters, numbers, dots, underscores, #, or hyphens.",
  },
};

function normalize(name, value) {
  const trimmed = value.trim();
  return name.toLowerCase().includes("email") ? trimmed.toLowerCase() : trimmed;
}

function setError(name, message = "") {
  const input = fields[name];
  const error = document.querySelector(`#${name}-error`);
  if (error) error.textContent = message;
  if (input?.closest(".input-wrap")) {
    input.closest(".input-wrap").classList.toggle("has-error", Boolean(message));
  }
  input?.setAttribute("aria-invalid", message ? "true" : "false");
}

function validateFirstStep() {
  let valid = true;
  Object.entries(rules).forEach(([name, rule]) => {
    const value = fields[name].value.trim();
    const message = !value ? "This field is required." : !rule.test(value) ? rule.message : "";
    setError(name, message);
    if (message) valid = false;
  });
  return valid;
}

function checkMatch(name) {
  const confirmName = `confirm${name[0].toUpperCase()}${name.slice(1)}`;
  const original = normalize(name, fields[name].value);
  const confirmation = normalize(confirmName, fields[confirmName].value);
  const wrap = fields[confirmName].closest(".input-wrap");
  const matches = Boolean(confirmation) && original === confirmation;
  wrap.classList.toggle("has-match", matches);
  wrap.querySelector(".match-state").textContent = matches ? "✓" : "";
  return { confirmName, matches, hasValue: Boolean(confirmation) };
}

function validateSecondStep() {
  let valid = true;
  ["email", "minecraftUsername", "discordUsername"].forEach((name) => {
    const { confirmName, matches, hasValue } = checkMatch(name);
    const message = !hasValue ? "Please re-enter this detail." : !matches ? "This does not match your first entry." : "";
    setError(confirmName, message);
    if (message) valid = false;
  });

  const consentError = fields.consent.checked ? "" : "Please confirm you agree before sending.";
  setError("consent", consentError);
  if (consentError) valid = false;
  return valid;
}

function showStep(step) {
  document.querySelectorAll(".form-step").forEach((panel) => {
    panel.classList.toggle("is-active", Number(panel.dataset.step) === step);
  });
  document.querySelectorAll(".progress-item").forEach((item) => {
    item.classList.toggle("is-active", Number(item.dataset.progress) <= step);
  });
  progress.classList.toggle("is-step-two", step === 2);
  formMessage.textContent = "";
  const firstInput = document.querySelector(`.form-step[data-step="${step}"] input`);
  firstInput?.focus({ preventScroll: true });
}

continueButton.addEventListener("click", () => {
  if (!validateFirstStep()) return;
  showStep(2);
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "center" });
});

backButton.addEventListener("click", () => showStep(1));

Object.keys(rules).forEach((name) => {
  fields[name].addEventListener("input", () => setError(name));
});

[
  ["confirmEmail", "email"],
  ["confirmMinecraftUsername", "minecraftUsername"],
  ["confirmDiscordUsername", "discordUsername"],
].forEach(([confirmName, originalName]) => {
  fields[confirmName].addEventListener("input", () => {
    setError(confirmName);
    checkMatch(originalName);
  });
});

fields.consent.addEventListener("change", () => setError("consent"));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";
  if (!validateFirstStep() || !validateSecondStep()) return;

  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Sending…";

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "We couldn't send your request. Please try again.");

    form.hidden = true;
    progress.hidden = true;
    successPanel.hidden = false;
    successPanel.focus?.();
  } catch (error) {
    formMessage.textContent = error.message || "We couldn't send your request. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Send for review";
  }
});

resetButton.addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  progress.hidden = false;
  successPanel.hidden = true;
  document.querySelector("#startedAt").value = String(Date.now());
  document.querySelectorAll(".has-match, .has-error").forEach((element) => element.classList.remove("has-match", "has-error"));
  document.querySelectorAll(".field-error").forEach((element) => (element.textContent = ""));
  showStep(1);
});
