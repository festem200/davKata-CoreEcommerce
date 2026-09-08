import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App", () => {
  it("muestra el nombre de la tienda", () => {
    render(<App />);

    expect(screen.getByText("Soultec")).toBeInTheDocument();
  });
});
