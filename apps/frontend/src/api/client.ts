import type { CartLineDto, OrderResponseDto, ProblemDetailDto, ProductDto, QuoteResultDto } from "@core-ecommerce/contracts";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetailDto,
  ) {
    super(problem.detail);
    this.name = "ApiError";
  }
}

const FALLBACK_PROBLEM: ProblemDetailDto = {
  type: "about:blank",
  title: "Error de red",
  status: 0,
  detail: "No se pudo contactar al servidor. Verifica tu conexión e intenta de nuevo.",
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = await response.json().then(
      (body: ProblemDetailDto) => body,
      () => FALLBACK_PROBLEM,
    );
    throw new ApiError(response.status, problem);
  }

  return response.json() as Promise<T>;
}

export async function fetchProducts(): Promise<readonly ProductDto[]> {
  const response = await fetch("/api/v1/products");
  return handleResponse(response);
}

export async function fetchQuote(cartLines: readonly CartLineDto[], couponCode: string | null): Promise<QuoteResultDto> {
  const response = await fetch("/api/v1/cart/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartLines, couponCode }),
  });
  return handleResponse(response);
}

export async function submitCheckout(
  cartLines: readonly CartLineDto[],
  couponCode: string | null,
  idempotencyKey: string,
): Promise<OrderResponseDto> {
  const response = await fetch("/api/v1/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ cartLines, couponCode }),
  });
  return handleResponse(response);
}
