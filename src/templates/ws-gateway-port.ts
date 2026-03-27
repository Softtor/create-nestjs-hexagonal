export const WS_GATEWAY_TOKEN = Symbol('WsGateway');

/**
 * Hexagonal port for WebSocket broadcasting.
 *
 * Inject via WS_GATEWAY_TOKEN — never import the concrete gateway class.
 * The concrete gateway lives in infrastructure/gateways/ and is registered with:
 *   { provide: WS_GATEWAY_TOKEN, useExisting: AppGateway }
 */
export interface WsGatewayPort {
  /**
   * Emit to all connected clients of an organization.
   * Uses room `org:${organizationId}` internally.
   */
  emitToOrganization(organizationId: string, event: string, data: Record<string, unknown>): void;

  /**
   * Emit to a specific user across all their connected sockets.
   * Uses room `user:${userId}` internally.
   */
  emitToUser(userId: string, event: string, data: Record<string, unknown>): void;

  /**
   * Emit to all connected clients regardless of organization.
   * Use only for system-level events with no tenant-scoped data.
   */
  emitGlobal(event: string, data: Record<string, unknown>): void;
}
