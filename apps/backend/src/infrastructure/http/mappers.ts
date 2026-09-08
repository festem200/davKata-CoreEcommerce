import type { OrderResponseDto } from "@core-ecommerce/contracts";
import type { Order } from "../../domain/model/Order.js";

export function toOrderResponseDto(order: Order): OrderResponseDto {
  return {
    id: order.id,
    idempotencyKey: order.idempotencyKey,
    createdAt: order.createdAt.toISOString(),
    cartLines: order.cartLines,
    couponCode: order.couponCode,
    quote: order.quote,
  };
}
