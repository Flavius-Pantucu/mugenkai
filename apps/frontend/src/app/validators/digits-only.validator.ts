import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function digitsOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return /^\d+$/.test(value) ? null : { digitsOnly: true };
  };
}
