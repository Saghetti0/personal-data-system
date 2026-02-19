import { Snowflake } from "@waltermin/pds-shared";

const SNOWFLAKE_EPOCH = new Date("2026-02-16T00:00:00.000Z").getTime();

export class SnowflakeGenerator {
  private sequence: number = 0;
  private lastTimestamp: number = -1;

  // 12 bits for sequence = 1024 possible values (0-1023)
  private readonly sequenceBits = 10;
  private readonly maxSequence = (1 << this.sequenceBits) - 1; // 1023

  // 42 bits for timestamp = ~140 years range
  // js only does bit shifts on u32, sighh
  private readonly timestampBits = 42;
  private readonly maxTimestamp = Number((1n << BigInt(this.timestampBits)) - 1n);

  /// Generate a unique snowflake ID
  generate(): Snowflake {
    let timestamp = this.getCurrentTimestamp();

    if (timestamp < this.lastTimestamp) {
      throw new Error("clock moved backwards");
    }

    if (timestamp === this.lastTimestamp) {
      // Same millisecond - increment sequence
      this.sequence = (this.sequence + 1) & this.maxSequence;
      
      if (this.sequence === 0) {
        // Sequence exhausted - wait for next millisecond
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      // New millisecond - reset sequence
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    if (timestamp > this.maxTimestamp) {
      throw new Error("timestamp overflow");
    }

    // curse javascript again (TODO: make this less awful)
    return Number((BigInt(timestamp) << BigInt(this.sequenceBits)) | BigInt(this.sequence));
  }

  /**
   * Parse a Snowflake ID to extract its components
   */
  parse(id: Snowflake): { timestamp: number; date: Date; sequence: number } {
    const sequence = id & this.maxSequence;
    const timestamp = id >> this.sequenceBits;
    const actualTimestamp = timestamp + SNOWFLAKE_EPOCH;

    return {
      timestamp,
      date: new Date(actualTimestamp),
      sequence,
    };
  }

  private getCurrentTimestamp(): number {
    return Date.now() - SNOWFLAKE_EPOCH;
  }

  private waitNextMillis(lastTimestamp: number): number {
    let timestamp = this.getCurrentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.getCurrentTimestamp();
    }
    return timestamp;
  }
}

const generator = new SnowflakeGenerator();

/// Generate a unique snowflake ID
export function generateSnowflake() {
  return generator.generate();
}
