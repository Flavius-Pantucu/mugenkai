import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class StrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, _args: ValidationArguments) {
    return (
      typeof password === 'string' &&
      password.length >= 8 &&
      /[A-Z]/.test(password)
    );
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter';
  }
}

export function StrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: StrongPasswordConstraint,
    });
  };
}
