import { json } from "@sveltejs/kit";

export function POST({ cookies }) {
	cookies.delete("token", {
		path: `/`,
		secure: false,
	});
	return json({ message: "Logout berhasil" });
}
