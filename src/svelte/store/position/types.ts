import type { TJSPosition } from './TJSPosition';

/**
 * Defines the shape of an instance / object that is positionable.
 */
interface Positionable {
   position: TJSPosition;
}

/**
 * Defines one or more positions or positionable objects.
 */
type PositionGroup = TJSPosition | Positionable | Iterable<TJSPosition> | Iterable<Positionable>;

export {
   PositionGroup,
   Positionable,
}
