import { describe, expect, it } from "vitest";
import { pecahArray } from "@lib/utils.js";

describe("Fungsi Pecah Array", () => {
	it("harus mengembalikan nilai true", () => {
		expect(pecahArray("CRUD", "R")).toEqual(true);
	});
	it("harus mengembalikan nilai false", () => {
		expect(pecahArray("CRU", "D")).toEqual(false);
	});
});
