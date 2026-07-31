import type {
	ArcGISQueryResponse,
	ArcGISEditResponse,
	ArcGISUser
} from "@/types";

const REFERER =
	process.env.NEXT_PUBLIC_SITE_URL ??
	(process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}`
		: "http://localhost:3000");

export async function generateToken(
	portalUrl: string,
	username: string,
	password: string
): Promise<string> {
	const params = new URLSearchParams({
		username,
		password,
		client: "referer",
		referer: REFERER,
		expiration: "1440",
		f: "json"
	});

	const res = await fetch(`${portalUrl}/sharing/rest/generateToken`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: REFERER
		},
		body: params.toString()
	});

	const data = await res.json();
	if (data.error)
		throw new Error(data.error.message || "Failed to generate token");
	if (!data.token) throw new Error("Invalid credentials");
	return data.token as string;
}

export async function getPortalSelf(
	portalUrl: string,
	token: string
): Promise<ArcGISUser> {
	const res = await fetch(
		`${portalUrl}/sharing/rest/community/self?f=json&token=${encodeURIComponent(token)}`,
		{ headers: { Referer: REFERER } }
	);
	const data = await res.json();
	if (data.error)
		throw new Error(data.error.message || "Failed to get user info");

	return {
		username: data.username,
		fullName: data.fullName,
		email: data.email,
		thumbnailUrl: data.thumbnail
			? `${portalUrl}/sharing/rest/community/users/${data.username}/info/${data.thumbnail}?token=${token}`
			: undefined,
		groups: (data.groups || []).map((g: { id: string; title: string }) => ({
			id: g.id,
			title: g.title
		}))
	};
}

export async function queryFeatures<T>(
	layerUrl: string,
	token: string,
	where = "1=1",
	outFields = "*",
	orderByFields?: string
): Promise<T[]> {
	const params = new URLSearchParams({
		where,
		outFields,
		returnGeometry: "false",
		f: "json",
		token
	});
	if (orderByFields) params.set("orderByFields", orderByFields);

	const res = await fetch(`${layerUrl}/query?${params.toString()}`, {
		headers: { Referer: REFERER }
	});
	const data: ArcGISQueryResponse<T> = await res.json();
	if (data.error) throw new Error(data.error.message);
	return (data.features || []).map((f) => f.attributes);
}

export async function getFeatureCount(
	layerUrl: string,
	token: string
): Promise<number> {
	const params = new URLSearchParams({
		where: "1=1",
		returnCountOnly: "true",
		f: "json",
		token
	});
	const res = await fetch(`${layerUrl}/query?${params.toString()}`, {
		headers: { Referer: REFERER }
	});
	const data = await res.json();
	if (data.error) throw new Error(data.error.message);
	return data.count as number;
}

export async function addFeature(
	layerUrl: string,
	token: string,
	attributes: Record<string, unknown>,
	geometry?: { x: number; y: number; spatialReference?: { wkid: number } }
): Promise<ArcGISEditResponse> {
	const feature: Record<string, unknown> = { attributes };
	if (geometry) {
		feature.geometry = {
			...geometry,
			spatialReference: geometry.spatialReference ?? { wkid: 4326 },
		};
	}

	const params = new URLSearchParams({
		features: JSON.stringify([feature]),
		f: "json",
		token
	});

	const res = await fetch(`${layerUrl}/addFeatures`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: REFERER
		},
		body: params.toString()
	});
	const data: ArcGISEditResponse = await res.json();
	if (data.error) throw new Error(data.error.message);
	return data;
}

export async function updateFeature(
	layerUrl: string,
	token: string,
	objectid: number,
	attributes: Record<string, unknown>
): Promise<ArcGISEditResponse> {
	const params = new URLSearchParams({
		features: JSON.stringify([{ attributes: { objectid, ...attributes } }]),
		f: "json",
		token
	});

	const res = await fetch(`${layerUrl}/updateFeatures`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: REFERER
		},
		body: params.toString()
	});
	const data: ArcGISEditResponse = await res.json();
	if (data.error) throw new Error(data.error.message);
	return data;
}

export async function deleteFeature(
	layerUrl: string,
	token: string,
	objectid: number
): Promise<ArcGISEditResponse> {
	const params = new URLSearchParams({
		objectIds: String(objectid),
		f: "json",
		token
	});

	const res = await fetch(`${layerUrl}/deleteFeatures`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: REFERER
		},
		body: params.toString()
	});
	const data: ArcGISEditResponse = await res.json();
	if (data.error) throw new Error(data.error.message);
	return data;
}
