import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rates.functions-DyeEylmi.js
var getUsdVnd_createServerFn_handler = createServerRpc({
	id: "a0cdaf075ba169971a25549de629f4725e8f274ae6c3dc3697e3d54004e8f031",
	name: "getUsdVnd",
	filename: "src/lib/rates.functions.ts"
}, (opts) => getUsdVnd.__executeServer(opts));
var getUsdVnd = createServerFn({ method: "GET" }).handler(getUsdVnd_createServerFn_handler, async () => {
	try {
		const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=VND", { signal: AbortSignal.timeout(8e3) });
		if (!res.ok) return { ok: false };
		const vnd = (await res.json()).rates?.VND;
		if (!vnd) return { ok: false };
		return {
			ok: true,
			vnd
		};
	} catch {
		return { ok: false };
	}
});
//#endregion
export { getUsdVnd_createServerFn_handler };
