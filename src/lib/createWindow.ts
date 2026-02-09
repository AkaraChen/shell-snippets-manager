import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export async function openCreateWindow(tab: "snippet" | "alias") {
	const existing = await WebviewWindow.getByLabel("create");
	if (existing) {
		await existing.setFocus();
		return;
	}

	new WebviewWindow("create", {
		url: `/create?tab=${tab}`,
		title: "Create",
		width: 1200,
		height: 800,
		center: true,
		resizable: true,
	});
}
