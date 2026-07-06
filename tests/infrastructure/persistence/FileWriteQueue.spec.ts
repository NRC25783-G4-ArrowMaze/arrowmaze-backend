import { serialize } from '../../../src/infrastructure/persistence/FileWriteQueue.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('FileWriteQueue', () => {
  it('should_run_operations_sequentially_when_they_target_the_same_file', async () => {
    // Arrange
    const executionLog: string[] = [];

    const makeOperation = (name: string, durationMs: number) => async () => {
      executionLog.push(`${name}:start`);
      await delay(durationMs);
      executionLog.push(`${name}:end`);
      return name;
    };

    // Act: lanzamos las tres a la vez; la más lenta va primero
    const results = await Promise.all([
      serialize('/data/file.json', makeOperation('op1', 30)),
      serialize('/data/file.json', makeOperation('op2', 10)),
      serialize('/data/file.json', makeOperation('op3', 1)),
    ]);

    // Assert: sin solapamiento y en orden de llegada
    expect(executionLog).toEqual([
      'op1:start', 'op1:end',
      'op2:start', 'op2:end',
      'op3:start', 'op3:end',
    ]);
    expect(results).toEqual(['op1', 'op2', 'op3']);
  });

  it('should_run_operations_concurrently_when_they_target_different_files', async () => {
    // Arrange
    const executionLog: string[] = [];

    // Act: la operación del archivo A es lenta; la del B debe terminar antes
    await Promise.all([
      serialize('/data/a.json', async () => {
        executionLog.push('a:start');
        await delay(30);
        executionLog.push('a:end');
      }),
      serialize('/data/b.json', async () => {
        executionLog.push('b:start');
        await delay(1);
        executionLog.push('b:end');
      }),
    ]);

    // Assert: b terminó mientras a seguía en curso
    expect(executionLog).toEqual(['a:start', 'b:start', 'b:end', 'a:end']);
  });

  it('should_execute_next_operation_when_previous_one_rejects', async () => {
    // Arrange
    const failing = serialize('/data/fail.json', async () => {
      throw new Error('disk on fire');
    });

    // Act
    const following = serialize('/data/fail.json', async () => 'survivor');

    // Assert: el fallo se propaga a su llamador, pero no bloquea la cola
    await expect(failing).rejects.toThrow('disk on fire');
    await expect(following).resolves.toBe('survivor');
  });
});
