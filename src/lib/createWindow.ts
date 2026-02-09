import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export async function openCreateWindow(tab: "snippet" | "alias", editId?: number) {
	const existing = await WebviewWindow.getByLabel("create");
	if (existing) {
		await existing.setFocus();
		return;
	}

	const params = new URLSearchParams({ tab });
	if (editId != null) {
		params.set("editId", String(editId));
	}

	new WebviewWindow("create", {
		url: `/create?${params}`,
		title: editId != null ? "Edit" : "Create",
		width: 1200,
		height: 800,
		center: true,
		resizable: true,
	});
}
