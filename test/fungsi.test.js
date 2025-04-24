import { describe, expect, it } from "vitest";
import { pecahArray, generatePeriode } from "@lib/utils.js";

describe("Fungsi Pecah Array", () => {
	it("harus mengembalikan nilai true", () => {
		expect(pecahArray("CRUD", "R")).toEqual(true);
	});
	it("harus mengembalikan nilai false", () => {
		expect(pecahArray("CRU", "D")).toEqual(false);
	});
});

describe("Fungsi Generate Periode", () => {
	it("return nilai periode bulan depan apabila start < now()", () => {
		expect(generatePeriode(23, 22)).toEqual({ start: "2025-04-23", end: "2025-05-22" });
	});
	it("return nilai periode bulan depan apabila start = now()", () => {
		expect(generatePeriode(24, 23)).toEqual({ start: "2025-04-24", end: "2025-05-23" });
	});
	it("return nilai periode bulan sebelumnya apabila start > now()", () => {
		expect(generatePeriode(25, 24)).toEqual({ start: "2025-03-25", end: "2025-04-24" });
	});
});
