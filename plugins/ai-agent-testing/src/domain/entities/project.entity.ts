/**
 * Project Domain Entity
 */
export class Project {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public defaultModelId: string | null,
    public settings: Record<string, any> | null,
    public createdAt: Date,
    public updatedAt: Date,
    public createdBy: string | null,
  ) {}

  updateName(name: string): void {
    this.name = name;
  }

  updateDescription(description: string | null): void {
    this.description = description;
  }

  setDefaultModel(modelId: string | null): void {
    this.defaultModelId = modelId;
  }

  updateSettings(settings: Record<string, any> | null): void {
    this.settings = settings;
  }
}
