// ---------------------------------------------------------------------------
// Field Schema -- defines what can be toggled in the privacy UI
// ---------------------------------------------------------------------------

export interface FieldDefinition {
  label: string;
  /** Whether the field is visible by default when creating a new share */
  default: boolean;
  /** Dot-path to another field that must be visible for this field to be available */
  requires?: string;
  /** Human-readable description shown in share modal tooltips or help text */
  description?: string;
}

export interface FieldGroupDefinition {
  label: string;
  type: "group";
  children: Record<string, FieldDefinition>;
}

export type FieldSchema = Record<string, FieldDefinition | FieldGroupDefinition>;

/** Flat visibility map produced by the privacy engine: `{ "bio": true, "analytics.viewsOverTime": false }` */
export type VisibleFields = Record<string, boolean>;

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export interface Share {
  id: string;
  type: string;
  token: string;
  ownerId: string;
  params: Record<string, unknown>;
  visibleFields: VisibleFields;
  viewCount: number;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface CreateShareInput {
  type: string;
  token: string;
  ownerId: string;
  params: Record<string, unknown>;
  visibleFields: VisibleFields;
  expiresAt?: Date | null;
}

export interface ShareAnalyticsData {
  totalShares: number;
  totalViews: number;
  sharesByType: Array<{ type: string; count: number; views: number }>;
  topShares: Array<Share & { rank: number }>;
  recentActivity: Array<Share>;
}

export interface ShareableStorage {
  createShare(input: CreateShareInput): Promise<Share>;
  getShare(token: string): Promise<Share | null>;
  getSharesByOwner(ownerId: string, type?: string): Promise<Share[]>;
  revokeShare(shareId: string, ownerId: string): Promise<void>;
  incrementViewCount(token: string): Promise<void>;
  /** Optional: return aggregate analytics. If not implemented, a default is derived from getSharesByOwner. */
  getAnalytics?(ownerId: string, type?: string): Promise<ShareAnalyticsData>;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface ShareableUser {
  id: string;
  name?: string;
}

export interface ShareableAuthProvider {
  getUser(request: Request): Promise<ShareableUser | null>;
}

// ---------------------------------------------------------------------------
// Shareable Definition (what the developer creates with `.define()`)
// ---------------------------------------------------------------------------

export interface GetDataContext<TParams = Record<string, unknown>> {
  ownerId: string;
  params: TParams;
}

export interface OGImageMetric {
  label: string;
  value: string;
}

export interface OGImageConfig {
  title: string;
  subtitle?: string;
  metrics?: OGImageMetric[];
}

export type OGImageFn<TData = unknown> = (ctx: {
  data: TData;
  visibleFields: VisibleFields;
  ownerName: string;
}) => OGImageConfig;

export interface ShareableDefinitionInput<TData = unknown, TParams = Record<string, unknown>> {
  fields: FieldSchema;
  params?: unknown; // Zod schema or similar -- validated at runtime
  getData: (ctx: GetDataContext<TParams>) => Promise<TData>;
  filterData?: (ctx: { data: TData; visibleFields: VisibleFields }) => TData;
  ogImage?: OGImageFn<TData>;
}

export interface ShareableDefinition<TData = unknown, TParams = Record<string, unknown>> {
  id: string;
  fields: FieldSchema;
  paramsSchema?: unknown;
  getData: (ctx: GetDataContext<TParams>) => Promise<TData>;
  filterData?: (ctx: { data: TData; visibleFields: VisibleFields }) => TData;
  ogImage?: OGImageFn<TData>;
}

// ---------------------------------------------------------------------------
// Config (top-level createShareable options)
// ---------------------------------------------------------------------------

export type OwnerDisplay = "first-name" | "full" | "anonymous";

export interface ShareableDefaults {
  tokenLength?: number;
  ownerDisplay?: OwnerDisplay;
  trackViews?: boolean;
}

export interface ShareableConfig {
  storage: ShareableStorage;
  auth: ShareableAuthProvider;
  baseUrl: string;
  defaults?: ShareableDefaults;
}

// ---------------------------------------------------------------------------
// Shareable Instance (returned by createShareable)
// ---------------------------------------------------------------------------

export interface ShareableInstance {
  config: ShareableConfig;
  definitions: Map<string, ShareableDefinition>;
  define<TData = unknown, TParams = Record<string, unknown>>(
    id: string,
    input: ShareableDefinitionInput<TData, TParams>,
  ): ShareableDefinition<TData, TParams>;
  getDefinition(id: string): ShareableDefinition | undefined;
}

// ---------------------------------------------------------------------------
// API Handler types
// ---------------------------------------------------------------------------

export type ShareableAction =
  | {
      kind: "create";
      type: string;
      visibleFields: VisibleFields;
      params: Record<string, unknown>;
      expiresAt?: string;
    }
  | { kind: "list"; type?: string }
  | { kind: "get"; token: string }
  | { kind: "revoke"; shareId: string }
  | { kind: "view"; token: string }
  | { kind: "og"; token: string }
  | { kind: "analytics"; type?: string };

export interface SharedViewData<TData = unknown> {
  data: TData;
  visibleFields: VisibleFields;
  ownerName: string;
  viewCount: number;
  type: string;
  createdAt: Date;
}
