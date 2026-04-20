import 'reflect-metadata';
import { METADATA_KEYS } from '../constants';

/**
 * Decorator that marks a method to be called after the application is fully initialized.
 *
 * OnReady methods are called:
 * - After all modules are loaded
 * - After database migrations are complete
 * - After all controllers are registered
 * - Before the framework:bootstrap event is emitted
 *
 * Use this for initialization that depends on the database or other services.
 *
 * @example
 * ```typescript
 * @Controller()
 * export class ShopController {
 *   @OnReady()
 *   async initializeShops(): Promise<void> {
 *     await this.shopService.seedFromConfig();
 *   }
 * }
 * ```
 */
export function OnReady(): MethodDecorator {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        // Get existing onReady methods or create new array
        const existingMethods: string[] = Reflect.getMetadata(METADATA_KEYS.ON_READY, target.constructor) || [];

        // Add this method to the list
        existingMethods.push(propertyKey as string);

        // Store on the constructor (class level)
        Reflect.defineMetadata(METADATA_KEYS.ON_READY, existingMethods, target.constructor);

        return descriptor;
    };
}

/**
 * Get all OnReady methods from a class
 */
export function getOnReadyMethods(target: Function): string[] {
    return Reflect.getMetadata(METADATA_KEYS.ON_READY, target) || [];
}
