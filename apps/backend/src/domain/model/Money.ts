/**
 * Dinero representado siempre en centavos enteros. Nunca se usan floats
 * decimales para valores monetarios: 0.1 + 0.2 !== 0.3, y en un core
 * bancario esa imprecisión no es aceptable.
 */
export type Cents = number;

export function centsFromDecimal(amountInMainUnit: number): Cents {
  return Math.round(amountInMainUnit * 100);
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Calcula el monto de un descuento sobre `amountCents`, redondeando siempre
 * hacia abajo (a favor de la tienda). Es la política de redondeo oficial
 * del motor: documentada en docs/arquitectura.md y verificada por test.
 */
export function floorPercentageOf(amountCents: Cents, rate: number): Cents {
  return Math.floor(amountCents * rate);
}

/**
 * Reparte `totalToAllocate` entre las líneas según su peso relativo en
 * `weights`, garantizando que la suma de lo repartido sea EXACTAMENTE
 * `totalToAllocate` (el clásico problema del centavo perdido). El residuo
 * de los redondeos hacia abajo se asigna a la última línea con peso > 0.
 */
export function allocateProportionally(
  totalToAllocate: Cents,
  weights: readonly Cents[],
): Cents[] {
  if (weights.length === 0) {
    return [];
  }

  if (totalToAllocate === 0) {
    return weights.map(() => 0);
  }

  const totalWeight = sumCents(weights);

  if (totalWeight === 0) {
    // No hay ninguna línea con peso > 0 pero igual hay algo que repartir:
    // no existe una distribución proporcional posible, así que todo va a
    // la última línea. La alternativa (devolver ceros) rompería la
    // invariante que esta función promete: la suma repartida SIEMPRE debe
    // igualar el total, sin excepción.
    return weights.map((_, index) => (index === weights.length - 1 ? totalToAllocate : 0));
  }

  const allocations = weights.map((weight) => Math.floor((totalToAllocate * weight) / totalWeight));
  const allocatedSoFar = sumCents(allocations);
  const remainder = totalToAllocate - allocatedSoFar;

  const lastPositiveWeightIndex = weights.reduce<number>(
    (lastIndex, weight, index) => (weight > 0 ? index : lastIndex),
    -1,
  );

  if (remainder !== 0 && lastPositiveWeightIndex >= 0) {
    allocations[lastPositiveWeightIndex] = (allocations[lastPositiveWeightIndex] ?? 0) + remainder;
  }

  return allocations;
}
