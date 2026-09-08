/**
 * Serializa operaciones asíncronas en el orden en que llegan. El adaptador
 * JSON lee y escribe el archivo completo en cada operación de escritura;
 * sin este mutex, dos `decrementStock` concurrentes podrían leer el mismo
 * estado y pisarse el uno al otro al escribir.
 */
export class AsyncMutex {
  private tail: Promise<unknown> = Promise.resolve();

  async runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(operation, operation);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
