import nodes7 from 'nodes7';

export class S7Connector {
  private conn = new nodes7();
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private host: string, private rack: number = 0, private slot: number = 1) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.conn.initiateConnection({ port: 102, host: this.host, rack: this.rack, slot: this.slot }, (err) => {
        if (err) {
          console.error(`[S7] Connection failed to ${this.host}`, err);
          return reject(err);
        }
        console.log(`[S7] Connected to ${this.host} (Rack: ${this.rack}, Slot: ${this.slot})`);
        resolve();
      });
    });
  }

  startPolling(tags: Record<string, string>, intervalMs: number, callback: (name: string, value: any) => void): void {
    if (this.intervalId) clearInterval(this.intervalId);

    // Register tags with the nodeS7 library
    this.conn.setTranslationCB((tag) => tags[tag]);
    this.conn.addItems(Object.keys(tags));

    this.intervalId = setInterval(() => {
      this.conn.readAllItems((err, values) => {
        if (err) {
          console.error(`[S7] Error reading tags from ${this.host}:`, err);
          return;
        }
        
        for (const [key, value] of Object.entries(values)) {
          callback(key, value);
        }
      });
    }, intervalMs);
    
    console.log(`[S7] Started polling ${Object.keys(tags).length} tags every ${intervalMs}ms`);
  }

  disconnect(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.conn.dropConnection(() => {
      console.log(`[S7] Disconnected from ${this.host}`);
    });
  }
}
