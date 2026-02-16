import { OplogEntry, OplogObjectType, Snowflake } from "./types";
import mysql from "mysql2/promise";
import { encode, decode } from "@msgpack/msgpack";

export type PersistedObject = {
  id: Snowflake;
  type: OplogObjectType,
  data: unknown,
};

export class Database {
  private readonly db: mysql.Pool;

  constructor(url: string) {
    this.db = mysql.createPool(url);
  }

  async writeCurrentObject(objId: Snowflake, objType: string, data: unknown) {
    await this.db.execute(
      "REPLACE INTO current_objects (obj_id, obj_type, obj_data) VALUES (?, ?, ?)",
      [objId, objType, encode(data)]
    );
  }

  async deleteCurrentObject(objId: Snowflake) {
    await this.db.execute(
      "DELETE FROM current_objects WHERE obj_id = ?",
      [objId]
    );
  }

  async getAllCurrentObjects(): Promise<PersistedObject[]> {
    const [rows] = await this.db.execute(
      "SELECT obj_id, obj_type, obj_data FROM current_objects"
    );

    return (rows as any[]).map(row => ({
      id: Number(row.obj_id),
      type: row.obj_type as OplogObjectType,
      data: decode(row.obj_data as Buffer)
    }));
  }

  async writeOplogEntry(entry: OplogEntry) {
    await this.db.execute(
      "INSERT INTO oplog (oplog_id, obj_id, obj_type, data) VALUES (?, ?, ?, ?)",
      [entry.id, entry.obj_id, entry.obj_type, (entry.data === null ? null : encode(entry.data))]
    );
  }
}
