export function validateRegistration(data, users) {
  const errors = {};

  let usernameTaken = false;
  let emailTaken = false;
  users.forEach((user) => {
    if (user.username.toLowerCase() === data.username.toLowerCase()) {
      usernameTaken = true;
    }
    if (user.email.toLowerCase() === data.email.toLowerCase()) {
      emailTaken = true;
    }
  });

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
  form.querySelectorAll("[data-error-for]").forEach((element) => {
    element.textContent = errors[element.dataset.errorFor] || "";
  });

  form.querySelectorAll("[name]").forEach((field) => {
    if (errors[field.name]) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.setAttribute("aria-invalid", "false");
    }
  });
}
