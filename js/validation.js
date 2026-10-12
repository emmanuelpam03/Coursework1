export function validateRegistration(data, users) {
  const errors = {};

  let usernameTaken = false;
  let emailTaken = false;
  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    if (user.username.toLowerCase() === data.username.toLowerCase()) {
      usernameTaken = true;
    }
    if (user.email.toLowerCase() === data.email.toLowerCase()) {
      emailTaken = true;
    }
  }

  if (!data.username || data.username.length < 3 || data.username.length > 18) {
    errors.username = "Use 3-18 characters.";
  } else if (usernameTaken) {
    errors.username = "That username is already in use.";
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
  } else if (emailTaken) {
    errors.email = "That email is already registered.";
  }

  if (!data.password || data.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }
  if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!data.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!data.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!data.dateOfBirth || new Date(data.dateOfBirth) > new Date()) {
    errors.dateOfBirth = "Choose a valid date.";
  }
  if (!data.country) {
    errors.country = "Select a country.";
  }
  if (!data.terms) {
    errors.terms = "Accept the local account terms.";
  }
  return errors;
}

export function showErrors(form, errors) {
  const errorElements = form.querySelectorAll("[data-error-for]");
  for (let index = 0; index < errorElements.length; index += 1) {
    const element = errorElements[index];
    element.textContent = errors[element.dataset.errorFor] || "";
  }

  const fields = form.querySelectorAll("[name]");
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (errors[field.name]) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.setAttribute("aria-invalid", "false");
    }
  }
}
