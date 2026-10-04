import { registerDecorator, ValidationOptions } from 'class-validator';
import { isIanaTimezone } from '../utils/timezone.util';

export function IsIanaTimezone(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isIanaTimezone',
      target: target.constructor,
      propertyName: String(propertyName),
      options,
      validator: { validate: isIanaTimezone, defaultMessage: () => 'timezone must be a valid IANA timezone' },
    });
  };
}
