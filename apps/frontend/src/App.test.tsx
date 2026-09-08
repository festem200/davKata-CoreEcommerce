import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { App } from "./App.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("muestra el nombre de la tienda y el catálogo cargado del backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ id: "p1", name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: 4500, stock: 10 }]),
      }),
    );

    render(<App />);

    expect(screen.getByText("Soultec")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("Audífonos Bluetooth")).toBeInTheDocument());
  });

  it("muestra un mensaje de error si el catálogo no carga", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ type: "t", title: "Error", status: 500, detail: "El catálogo no está disponible" }),
      }),
    );

    render(<App />);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("El catálogo no está disponible"));
  });
});
