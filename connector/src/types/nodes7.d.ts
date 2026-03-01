declare module 'nodes7' {
  interface Nodes7Connection {
    initiateConnection(
      opts: { port: number; host: string; rack: number; slot: number },
      callback: (err: Error | null) => void
    ): void;
    setTranslationCB(cb: (tag: string) => string): void;
    addItems(tags: string[]): void;
    readAllItems(callback: (err: Error | null, values: Record<string, unknown>) => void): void;
    writeItems(arg: string | string[], value: unknown | unknown[], callback: (err: Error | null) => void): void;
    dropConnection(callback: () => void): void;
  }

  interface NodeS7Constructor {
    new (): Nodes7Connection;
    (): Nodes7Connection;
  }

  const nodes7: NodeS7Constructor;
  export default nodes7;
}
