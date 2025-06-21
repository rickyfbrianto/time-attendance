import { describe, expect, it } from "vitest";
import { pecahArray, generatePeriode, getColorCalendar, getLastIjinDate, pecahKataOther } from "$/lib/utils.js";

describe("Test Pecah Array", () => {
	it("harus mengembalikan nilai true", () => {
		expect(pecahArray("CRUD", "R")).toEqual(true);
	});
	it("harus mengembalikan nilai false", () => {
		expect(pecahArray("CRU", "D")).toEqual(false);
	});
});

describe("Test Generate Periode", () => {
	// unit testing ini akan bernilai false karena nilai return berdasarkan dari tanggal now()
	it("return nilai periode bulan depan apabila start < now()", () => {
		expect(generatePeriode(23, 22)).toEqual({ start: "2025-04-23", end: "2025-05-22" });
	});
	it("return nilai periode bulan depan apabila start = now()", () => {
		expect(generatePeriode(24, 23)).toEqual({ start: "2025-04-24", end: "2025-05-23" });
	});
	it("return nilai periode bulan sebelumnya apabila start > now()", () => {
		expect(generatePeriode(25, 24)).toEqual({ start: "2025-04-25", end: "2025-05-24" });
	});
});

describe("Test Get Calendar Color", () => {
	it("return nilai color yang sesuai calendar type", () => {
		expect(getColorCalendar("Calendar")).toEqual("#B0413E");
	});
	it("return nilai color apabila tidak ada type yang sesuai calendar", () => {
		expect(getColorCalendar("Tes")).toEqual("#1D2D44");
	});
});

describe("Tes Tanggal terakhir ijin Calendar", () => {
	it("Mendapatkan nilai terakir date ijin apabila WH == 8", () => {
		expect(getLastIjinDate("2025-04-25", 3, 8)).toEqual(new Date("2025-04-29"));
	});
	it("Mendapatkan nilai terakir date ijin apabila WH == 7", () => {
		expect(getLastIjinDate("2025-04-25", 3, 7)).toEqual(new Date("2025-04-28"));
	});
});

describe("Tes pecah kata menjadi other", () => {
	it("Split 2 kata ", () => {
		expect(pecahKataOther("Ricky, Febrianto, Ryan", 2)).toEqual("Ricky, Febrianto and 1 other");
	});
	it("Split 3 kata ", () => {
		expect(pecahKataOther("Ricky, Febrianto, Ryan, Udin, Dedy", 3)).toEqual("Ricky, Febrianto, Ryan and 2 others");
	});
});
