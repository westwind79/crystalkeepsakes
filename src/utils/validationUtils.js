// utils/validationUtils.js
export const validateField = (value, rules) => {
  const errors = [];
  
  if (rules.required && !value) {
    errors.push('This field is required');
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Minimum ${rules.minLength} characters required`);
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Maximum ${rules.maxLength} characters allowed`);
  }
  
  return errors;
};