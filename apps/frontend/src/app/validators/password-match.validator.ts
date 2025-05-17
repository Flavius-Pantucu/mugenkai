import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(
  passwordField: string,
  confirmPasswordField: string
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const password = formGroup.get(passwordField)?.value;
    const confirmPassword = formGroup.get(confirmPasswordField)?.value;

    if (password !== confirmPassword) {
      formGroup
        .get(confirmPasswordField)
        ?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      const errors = formGroup.get(confirmPasswordField)?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          formGroup.get(confirmPasswordField)?.setErrors(null);
        } else {
          formGroup.get(confirmPasswordField)?.setErrors(errors);
        }
      }
      return null;
    }
  };
}
