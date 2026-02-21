import { error, redirect } from "@sveltejs/kit";
import { isUrlActive, prisma } from "$/lib/utils.js";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ url, locals, depends }) => {
	depends("app:protected");
	if (url.pathname == "/") throw redirect(307, `/dashboard`);

	const { user, userProfile } = locals;
	const getSetting = await prisma.setting.findFirst();
	if (!getSetting && url.pathname != "/admin") {
		redirect(303, `/admin?tab=setting&message=Admin perlu diatur dahulu`);
	}

	if (!user?.department) throw error(500, "User tidak mempunyai departemen");
	if (url.pathname !== "/dashboard") {
		if (!userProfile) throw error(500, "User tidak mempunyai profil");
		if (!user.location || !user.email || !user.phone || !user.approver || !user.substitute) throw error(500, "Mohon lengkapi data pribadi anda dulu");
		if (!user?.signature) throw error(500, "Anda tidak memiliki digital signature, silahkan upload signature dahulu");
	}
	if (url.pathname == "/security" && userProfile?.access_security != "R") throw error(500, "Anda tidak memiliki akses membuka halaman security");

	const imageUrl = import.meta.env.VITE_VIEW_SIGNATURE;
	const isValid = await isUrlActive(imageUrl);
	if (!isValid) throw error(500, `Service masih mati, silahkan dinyalakan`);

	return {
		user,
		userProfile,
		periode: getSetting,
	};
}
