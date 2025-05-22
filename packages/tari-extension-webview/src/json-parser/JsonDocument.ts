import { v4 as uuidv4 } from "uuid";

export class JsonDocument {
  public id: string;
  public jsonString: string;

  constructor(
    public title: string,
    public json: object,
  ) {
    this.id = uuidv4();
    this.jsonString = JSON.stringify(json, null, 2);
  }
}
