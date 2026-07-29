import { Title, Text, Card, Button, Tabs } from "@mantine/core";
import { IconMap2, IconExternalLink } from "@tabler/icons-react";
import Layout from "@/components/Layout";
import { useAuthStore } from "@/store/auth";

function withToken(url: string, token: string | null) {
	if (!token) return url;
	const u = new URL(url);
	u.searchParams.set("token", token);
	return u.toString();
}

export default function GISPage() {
	const portalUrl =
		process.env.NEXT_PUBLIC_ARCGIS_PORTAL_URL ||
		"https://gisportal.rerec.co.ke/portal";
	const webMapId = process.env.NEXT_PUBLIC_WEBMAP_ID;
	const constituenciesDashboardUrl =
		process.env.NEXT_PUBLIC_CONSTITUENCIES_DASHBOARD_URL;
	const countiesDashboardUrl = process.env.NEXT_PUBLIC_COUNTIES_DASHBOARD_URL;

	const { token, _hasHydrated } = useAuthStore();
	const authedToken = _hasHydrated ? token : null;

	const mapUrl = withToken(
		webMapId
			? `${portalUrl}/apps/mapviewer/index.html?webmap=${webMapId}`
			: `${portalUrl}/home/webmap/viewer.html`,
		authedToken
	);

	return (
		<Layout>
			<div className="flex flex-col gap-6">
				<Tabs defaultValue="constituencies" keepMounted={false}>
					<Tabs.List mb="md">
						<Tabs.Tab value="constituencies">Constituencies</Tabs.Tab>
						<Tabs.Tab value="counties">Counties</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="constituencies">
						{constituenciesDashboardUrl ? (
							<div
								className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
								style={{ height: "calc(100vh - 180px)", minHeight: 500 }}>
								<iframe
									src={`${constituenciesDashboardUrl}?token=${authedToken}`}
									// src={withToken(constituenciesDashboardUrl, authedToken)}
									style={{ width: "100%", height: "100%", border: "none" }}
									title="Constituencies Dashboard"
									allowFullScreen
								/>
							</div>
						) : (
							<PlaceholderCard
								label="Constituencies Dashboard Not Configured"
								description={
									<>
										Add{" "}
										<InlineCode>
											NEXT_PUBLIC_CONSTITUENCIES_DASHBOARD_URL
										</InlineCode>{" "}
										to your <InlineCode>.env.local</InlineCode> file to embed
										the ArcGIS constituencies dashboard here.
									</>
								}
								actionLabel="Open ArcGIS Portal"
								actionHref={`${portalUrl}/home`}
							/>
						)}
					</Tabs.Panel>

					<Tabs.Panel value="counties">
						{countiesDashboardUrl ? (
							<div
								className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
								style={{ height: "calc(100vh - 280px)", minHeight: 500 }}>
								<iframe
									src={withToken(countiesDashboardUrl, authedToken)}
									style={{ width: "100%", height: "100%", border: "none" }}
									title="Counties Dashboard"
									allowFullScreen
								/>
							</div>
						) : (
							<PlaceholderCard
								label="Counties Dashboard Not Configured"
								description={
									<>
										Add{" "}
										<InlineCode>NEXT_PUBLIC_COUNTIES_DASHBOARD_URL</InlineCode>{" "}
										to your <InlineCode>.env.local</InlineCode> file to embed
										the ArcGIS counties dashboard here.
									</>
								}
								actionLabel="Open ArcGIS Portal"
								actionHref={`${portalUrl}/home`}
							/>
						)}
					</Tabs.Panel>
				</Tabs>
			</div>
		</Layout>
	);
}

function InlineCode({ children }: { children: React.ReactNode }) {
	return (
		<code
			style={{
				background: "#f3f4f6",
				padding: "1px 6px",
				borderRadius: 4,
				fontSize: 13
			}}>
			{children}
		</code>
	);
}

function PlaceholderCard({
	label,
	description,
	actionLabel,
	actionHref
}: {
	label: string;
	description: React.ReactNode;
	actionLabel: string;
	actionHref: string;
}) {
	return (
		<Card
			shadow="xs"
			radius="lg"
			p={48}
			style={{ border: "1px solid #e9ecef", textAlign: "center" }}>
			<div className="flex flex-col items-center gap-5">
				<div
					className="rounded-2xl flex items-center justify-center"
					style={{ width: 80, height: 80, background: "#fd7e1418" }}>
					<IconMap2 size={40} color="#fd7e14" />
				</div>
				<div>
					<Text fw={700} size="lg" c="#1c1a17" mb={6}>
						{label}
					</Text>
					<Text c="dimmed" size="sm" maw={480} style={{ margin: "0 auto" }}>
						{description}
					</Text>
				</div>
				<Button
					component="a"
					href={actionHref}
					target="_blank"
					rel="noopener noreferrer"
					leftSection={<IconExternalLink size={16} />}
					variant="light"
					color="orange"
					size="md">
					{actionLabel}
				</Button>
			</div>
		</Card>
	);
}
